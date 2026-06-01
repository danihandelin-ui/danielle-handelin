#!/usr/bin/env python3
"""Fetch places from a public Google Maps saved list and write places.json."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PLACES_PATH = ROOT / "places.json"
DEFAULT_LIST_URL = "https://maps.app.goo.gl/SJWZdZ3FnuYX69Ri6"
POD_LAT, POD_LNG = 40.7081, -73.9571


def curl_bytes(url: str) -> bytes:
    proc = subprocess.run(
        ["curl", "-sL", "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", url],
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"curl failed ({proc.returncode}) for {url}")
    return proc.stdout


def curl_text(url: str) -> str:
    return curl_bytes(url).decode("utf-8", "replace")


def resolve_list_page(url: str) -> str:
    if "placelists/list/" in url:
        return url.split("?")[0]
    # Follow redirects for short links
    proc = subprocess.run(
        ["curl", "-sL", "-o", "/dev/null", "-w", "%{url_effective}", "-A", "Mozilla/5.0", url],
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode == 0 and proc.stdout.strip():
        return proc.stdout.strip().split("?")[0]
    return url


def extract_getlist_url(html: str) -> str:
    m = re.search(r"entitylist/getlist\?([^\"\\]+)", html)
    if not m:
        raise ValueError("Could not find entitylist/getlist on the list page (is the list public?)")
    qs = m.group(1).replace("&amp;", "&")
    qs = qs.replace("\\u003d", "=").replace("\\u0026", "&")
    qs = qs.split('"')[0]
    return "https://www.google.com/maps/preview/entitylist/getlist?" + qs


def coords_from_inner(inner) -> tuple[float, float] | None:
    if not isinstance(inner, list):
        return None
    for c in inner:
        if isinstance(c, list) and len(c) >= 4 and c[0] is None and c[1] is None:
            try:
                return float(c[2]), float(c[3])
            except (TypeError, ValueError):
                continue
    return None


def parse_places(data) -> list[dict]:
    out: list[dict] = []

    def try_row(arr):
        if not isinstance(arr, list) or len(arr) < 3:
            return
        name = arr[2] if isinstance(arr[2], str) else None
        if not name or len(name) < 2:
            return
        inner = arr[1] if len(arr) > 1 else None
        pair = coords_from_inner(inner)
        if not pair:
            return
        lat, lng = pair
        address = ""
        place_id = ""
        if isinstance(inner, list):
            if len(inner) > 4 and isinstance(inner[4], str):
                address = inner[4]
            if len(inner) > 7 and isinstance(inner[7], str) and inner[7].startswith("/g/"):
                place_id = inner[7]
        if not place_id:
            place_id = f"maps-{abs(hash((name, round(lat, 5), round(lng, 5)))) % 10**12}"
        maps_url = (
            "https://www.google.com/maps/search/?api=1&query="
            + urllib.parse.quote(name)
            + ("&query_place_id=" + urllib.parse.quote(place_id) if place_id.startswith("/g/") else "")
        )
        out.append(
            {
                "name": name,
                "address": address,
                "lat": lat,
                "lng": lng,
                "placeId": place_id,
            }
        )

    def walk(obj, depth=0):
        if depth > 50:
            return
        if isinstance(obj, list):
            try_row(obj)
            for x in obj:
                walk(x, depth + 1)

    walk(data)
    seen: set[tuple] = set()
    uniq: list[dict] = []
    for p in out:
        key = (p["placeId"], p["name"], round(p["lat"], 4), round(p["lng"], 4))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(p)
    return uniq


def dist_mi(a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    from math import asin, cos, radians, sin, sqrt

    r = 3959
    la1, la2 = radians(a_lat), radians(b_lat)
    d_la = radians(b_lat - a_lat)
    d_lo = radians(b_lng - a_lng)
    x = sin(d_la / 2) ** 2 + cos(la1) * cos(la2) * sin(d_lo / 2) ** 2
    return round(2 * r * asin(sqrt(x)) * 10) / 10


def norm_name(name: str) -> str:
    return re.sub(r"\s+", " ", (name or "").strip().lower())


def load_existing() -> list[dict]:
    if PLACES_PATH.is_file():
        return json.loads(PLACES_PATH.read_text(encoding="utf-8"))
    return []


def merge_places(fetched: list[dict], existing: list[dict]) -> list[dict]:
    by_id = {p.get("placeId"): p for p in existing if p.get("placeId")}
    by_name = {norm_name(p.get("name", "")): p for p in existing}
    merged: list[dict] = []
    for p in fetched:
        old = by_id.get(p["placeId"]) or by_name.get(norm_name(p["name"]))
        row = {
            "name": p["name"],
            "address": p.get("address") or (old or {}).get("address", ""),
            "lat": p["lat"],
            "lng": p["lng"],
            "placeId": p["placeId"],
            "neighborhood": (old or {}).get("neighborhood") or "NYC",
            "duration": (old or {}).get("duration") or 60,
            "mapsUrl": (old or {}).get("mapsUrl")
            or (
                "https://www.google.com/maps/search/?api=1&query="
                + urllib.parse.quote(p["name"])
                + (
                    "&query_place_id=" + urllib.parse.quote(p["placeId"])
                    if str(p["placeId"]).startswith("/g/")
                    else ""
                )
            ),
            "distFromPod": dist_mi(p["lat"], p["lng"], POD_LAT, POD_LNG),
        }
        merged.append(row)
    merged.sort(key=lambda x: x["name"].lower())
    return merged


def fetch_list(url: str) -> tuple[str, list[dict]]:
    page_url = resolve_list_page(url.strip())
    html = curl_text(page_url)
    api_url = extract_getlist_url(html)
    raw = curl_text(api_url)
    if raw.startswith(")]}'"):
        raw = raw[4:]
    data = json.loads(raw)
    list_name = ""
    list_name = ""
    try:
        if isinstance(data, list) and data and isinstance(data[0], list):
            for cell in data[0]:
                if isinstance(cell, str) and cell and cell not in ("", "Maps list"):
                    list_name = cell
                    break
            if not list_name and len(data[0]) > 5 and isinstance(data[0][5], str):
                list_name = data[0][5]
    except (IndexError, TypeError):
        pass
    return list_name or "Maps list", parse_places(data)


def sync_to_file(url: str = DEFAULT_LIST_URL) -> dict:
    list_name, fetched = fetch_list(url)
    merged = merge_places(fetched, load_existing())
    PLACES_PATH.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")
    return {"listName": list_name, "count": len(merged), "places": merged, "url": url}


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_LIST_URL
    try:
        result = sync_to_file(url)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    print(f"Synced {result['count']} places from “{result['listName']}” → {PLACES_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
