/**
 * YouTube helpers for reliable embeds and optional "is this video still alive?" checks.
 *
 * Embed URLs MUST use a video id (11 chars typically). Channel / @handle URLs
 * cannot be embedded as a video — use a curated default video id or open the
 * channel in a new tab instead.
 */

const YT_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"];

/** Pull a watch/embed/shorts/clip id from common YouTube URL shapes. */
export function extractYouTubeVideoId(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return normalizeId(id);
    }

    if (YT_HOSTS.includes(host) || host.endsWith(".youtube.com")) {
      const path = u.pathname;
      const q = u.searchParams.get("v");

      // watch?v=...
      if (q) return normalizeId(q);

      // /embed/VIDEO_ID
      const embedMatch = path.match(/^\/embed\/([^/?]+)/);
      if (embedMatch) return normalizeId(embedMatch[1]);

      // /shorts/VIDEO_ID
      const shortsMatch = path.match(/^\/shorts\/([^/?]+)/);
      if (shortsMatch) return normalizeId(shortsMatch[1]);

      // /live/VIDEO_ID
      const liveMatch = path.match(/^\/live\/([^/?]+)/);
      if (liveMatch) return normalizeId(liveMatch[1]);

      // /watch/VIDEO_ID (some redirects)
      const watchMatch = path.match(/^\/watch\/([^/?]+)/);
      if (watchMatch) return normalizeId(watchMatch[1]);
    }
  } catch {
    /* fall through — maybe bare id */
  }

  // Bare id (no URL)
  if (/^[\w-]{11}$/.test(s.replace(/\s/g, ""))) {
    return s.replace(/\s/g, "");
  }

  return null;
}

function normalizeId(id: string | undefined): string | null {
  if (!id) return null;
  const cleaned = id.split(/[#?&]/)[0];
  return /^[\w-]{11}$/.test(cleaned) ? cleaned : null;
}

/** iframe src for standard embeds (works when video is public + embeddable). */
export function toYouTubeEmbedUrl(videoId: string, opts?: { autoplay?: boolean }): string {
  const params = new URLSearchParams();
  if (opts?.autoplay) params.set("autoplay", "1");
  const q = params.toString();
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}${q ? `?${q}` : ""}`;
}

export function isLikelyChannelOrUserUrl(url: string): boolean {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const p = u.pathname.toLowerCase();
    return (
      p.startsWith("/@") ||
      p.startsWith("/channel/") ||
      p.startsWith("/c/") ||
      p.startsWith("/user/") ||
      (p === "/" && !u.searchParams.get("v"))
    );
  } catch {
    return false;
  }
}

export type YouTubeVideoCheck = {
  ok: boolean;
  videoId: string | null;
  title?: string;
  reason?: string;
};

/**
 * Server-side or same-origin proxy recommended for production (hides API key).
 * From the browser, use a key restricted by HTTP referrer in Google Cloud Console.
 *
 * Env: VITE_YOUTUBE_API_KEY
 */
export async function verifyYouTubeVideoWithApi(
  urlOrId: string,
  apiKey: string
): Promise<YouTubeVideoCheck> {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) {
    return { ok: false, videoId: null, reason: "Could not parse a video id from URL" };
  }
  if (!apiKey) {
    return { ok: false, videoId, reason: "Missing YouTube Data API key" };
  }

  const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
  endpoint.searchParams.set("part", "snippet,status,contentDetails");
  endpoint.searchParams.set("id", videoId);
  endpoint.searchParams.set("key", apiKey);

  const res = await fetch(endpoint.toString());
  if (!res.ok) {
    return { ok: false, videoId, reason: `API error: ${res.status}` };
  }

  const data = (await res.json()) as {
    items?: Array<{
      snippet?: { title?: string };
      status?: {
        uploadStatus?: string;
        privacyStatus?: string;
        embeddable?: boolean;
      };
    }>;
  };

  const item = data.items?.[0];
  if (!item) {
    return { ok: false, videoId, reason: "Video not found or not accessible" };
  }

  const { status, snippet } = item;
  if (status?.privacyStatus && status.privacyStatus !== "public" && status.privacyStatus !== "unlisted") {
    return { ok: false, videoId, title: snippet?.title, reason: `Video is ${status.privacyStatus}` };
  }
  if (status?.embeddable === false) {
    return { ok: false, videoId, title: snippet?.title, reason: "Embedding disabled by owner" };
  }
  if (status?.uploadStatus === "deleted" || status?.uploadStatus === "rejected") {
    return { ok: false, videoId, title: snippet?.title, reason: `Upload status: ${status.uploadStatus}` };
  }

  return { ok: true, videoId, title: snippet?.title };
}

export function toYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

/** Result: embed a video, or send the user to a channel (/ @handle). */
export type ResolveYouTubeResult =
  | {
      kind: "video";
      videoId: string;
      embedUrl: string;
      watchUrl: string;
    }
  | {
      kind: "channel";
      url: string;
      /** Why we did not use the video (API error, private, missing id, etc.). */
      fallbackReason?: string;
    };

export type ResolveYouTubeOptions = {
  /**
   * YouTube Data API v3 key. When set, the video must be found, public or unlisted,
   * and embeddable; otherwise we fall back to `channelUrl`.
   * When omitted, any parsed 11-char id is treated as a video (cannot confirm "public").
   */
  youtubeDataApiKey?: string;
};

function ensureHttpsYouTubeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!u.hostname.includes("youtube")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Prefer a **public (or unlisted), embeddable** video when the API key is supplied.
 * If the video URL is missing, invalid, fails API checks, or is actually a channel link
 * without a video id, use `channelUrl` (or interpret `videoUrl` as a channel if applicable).
 */
export async function resolveYouTubeVideoOrChannel(
  videoUrl: string | undefined | null,
  channelUrl: string | undefined | null,
  options: ResolveYouTubeOptions = {}
): Promise<ResolveYouTubeResult> {
  const { youtubeDataApiKey: apiKey } = options;

  const channelResolved = (() => {
    const c = channelUrl?.trim();
    if (!c) return null;
    return ensureHttpsYouTubeUrl(c);
  })();

  const useChannel = (fallbackReason?: string): ResolveYouTubeResult => {
    if (channelResolved) {
      return { kind: "channel", url: channelResolved, fallbackReason };
    }
    const v = videoUrl?.trim();
    if (v && isLikelyChannelOrUserUrl(v)) {
      const asChannel = ensureHttpsYouTubeUrl(v);
      if (asChannel) return { kind: "channel", url: asChannel, fallbackReason };
    }
    return {
      kind: "channel",
      url: "https://www.youtube.com/",
      fallbackReason: fallbackReason ?? "No channel URL configured",
    };
  };

  const v = videoUrl?.trim();
  if (!v) {
    return useChannel("No video URL provided");
  }

  if (isLikelyChannelOrUserUrl(v) && !extractYouTubeVideoId(v)) {
    const direct = ensureHttpsYouTubeUrl(v);
    if (direct) return { kind: "channel", url: direct };
    return useChannel();
  }

  const videoId = extractYouTubeVideoId(v);
  if (!videoId) {
    return useChannel("Could not parse a video id from URL");
  }

  if (apiKey) {
    const check = await verifyYouTubeVideoWithApi(videoId, apiKey);
    if (!check.ok) {
      return useChannel(check.reason);
    }
  }

  return {
    kind: "video",
    videoId,
    embedUrl: toYouTubeEmbedUrl(videoId),
    watchUrl: toYouTubeWatchUrl(videoId),
  };
}

/** How the Pocket Tech UI should show YouTube for a marker row. */
export type MarkerYoutubePresentation =
  | {
      mode: "embed";
      videoId: string;
      embedUrl: string;
      watchUrl: string;
      thumbnailUrl: string;
    }
  | {
      mode: "external";
      openUrl: string;
      label: string;
    };

/**
 * Prefer a real video id (embed + thumbnail). If `youtubeUrl` is a channel / @handle
 * or missing, return an external link (channel URL or YouTube search).
 */
export function getMarkerYoutubePresentation(marker: {
  youtubeUrl?: string;
  youtubeSearch?: string;
  brand: string;
  name: string;
}): MarkerYoutubePresentation {
  const searchUrl = () =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(
      marker.youtubeSearch || `${marker.brand} ${marker.name} paintball maintenance leak`
    )}`;

  const raw = marker.youtubeUrl?.trim();
  if (!raw) {
    return { mode: "external", openUrl: searchUrl(), label: "Search repair guides on YouTube" };
  }

  const videoId = extractYouTubeVideoId(raw);
  if (videoId) {
    return {
      mode: "embed",
      videoId,
      embedUrl: toYouTubeEmbedUrl(videoId),
      watchUrl: toYouTubeWatchUrl(videoId),
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  const https = raw.startsWith("http") ? raw : `https://${raw}`;
  if (isLikelyChannelOrUserUrl(https)) {
    return { mode: "external", openUrl: https, label: "Open official YouTube channel" };
  }

  try {
    const u = new URL(https);
    if (u.hostname.replace(/^www\./, "") === "youtu.be" || u.hostname.includes("youtube.com")) {
      return { mode: "external", openUrl: u.toString(), label: "Open on YouTube" };
    }
  } catch {
    /* fall through */
  }

  return { mode: "external", openUrl: searchUrl(), label: "Search YouTube for guides" };
}
