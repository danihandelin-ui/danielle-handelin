# NYC — DNA TRAVELS planner

## Open the planner

**Recommended** (drag-and-drop + saving work best):

```bash
cd "/Users/LilGooey/Desktop/DNA TRAVELS/NYC"
./start.sh
```

Then open [http://localhost:8080](http://localhost:8080) in Chrome or Safari.

You can also double-click `index.html`, but macOS often blocks drag-and-drop on local files — use **tap a spot → tap a time slot** instead.

## Google Maps list

| | |
|---|---|
| **Share link** | [https://maps.app.goo.gl/SJWZdZ3FnuYX69Ri6](https://maps.app.goo.gl/SJWZdZ3FnuYX69Ri6) |
| **Full list** | [Open in Google Maps](https://www.google.com/maps/placelists/list/RFnDigt7SdYPUDO3_AWA1l-Yn5bIyQ) |

The backlog is loaded from your list, not just the link. After you change the list in Google Maps:

1. Run `./start.sh` and open [http://localhost:8080](http://localhost:8080).
2. On **Plan**, paste the new share link and tap **Start planning**, or in **Backlog** tap **Refresh from Maps**.

To sync from the terminal (updates `places.json`):

```bash
python3 sync-maps-list.py "https://maps.app.goo.gl/YOUR_LINK"
```

## Google Calendar

This app does **not** auto-sync live with Google Calendar (that would need a Google Cloud project and sign-in). You can:

1. **Per activity** — after scheduling, tap **G Cal** on the block to add that event.
2. **Whole trip** — tap **Save** (stores trip + downloads a `.json` backup), then **Export** for the `.ics` calendar file. Import in [Google Calendar](https://calendar.google.com): **Settings → Import & export → Import**.
3. **Plan** — return to the landing page anytime; refresh the browser does the same.

Set **Trip start** first so dates match your real trip.

## How to plan

1. **Landing** — destination, Maps list link, trip dates, optional **flights** (blocked on the calendar), **day start/end times**, and home base.
2. **Calendar** — drag spots onto day columns; flight times show as blocked stripes.
3. **Backlog** — scroll neighborhoods; **Add your own activity** (optional: open Maps to **Save** to your list).
4. Use **Maps** for commute; **Export** or **Calendar** on each block for Google Calendar.
