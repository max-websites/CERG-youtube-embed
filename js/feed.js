/* ============================================================
   feed.js — shared video-feed utilities, used by every page.

   Playlist + count are read from the URL query string, so ONE set
   of files can power any topic — no file edits needed, just point
   the page (or the AEM iframe src) at a different query string:

     latest-videos.html?playlist=UUxxxxxxxxxxxxxxxxxxxxxx&max=3
     latest-videos.html?playlist=SOME_AGRIVOLTAICS_PLAYLIST&max=6

   Each page can still set its own DEFAULTS (see js/index.js etc.)
   so it works with no query string at all — the URL param always
   wins if present.
   ============================================================ */

/** Reads ?playlist= and ?max= from the current URL, falling back
 *  to this page's own defaults when a param isn't present. */
export function getFeedConfig(defaults = {}) {
  const params = new URLSearchParams(window.location.search);
  return {
    playlistId: params.get('playlist') || defaults.playlistId,
    maxResults: params.get('max') || defaults.maxResults || 4,
  };
}

/** Fetches playlist items through the Cloudflare Worker proxy
 *  (/api/videos) so the YouTube API key never reaches the browser.
 *  Returns the raw YouTube playlistItems array (filtered to items
 *  that actually have a video attached). */
export async function fetchVideos({ playlistId, maxResults }) {
  if (!playlistId) {
    throw new Error('No playlist set. Add ?playlist=UU... to the URL, or set a default in this page\u2019s script.');
  }

  const url = `/api/videos?playlist_id=${encodeURIComponent(playlistId)}&max_results=${encodeURIComponent(maxResults)}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || data.error || 'Could not load videos.');
  }

  return (data.items || []).filter(i => i.snippet?.resourceId?.videoId);
}

/** Extracts an 11-character YouTube video ID from a full URL in any
 *  common format (watch, youtu.be, embed, shorts, nocookie), or
 *  returns the input unchanged if it already looks like a bare video
 *  ID. Returns null if nothing usable was found. */
export function extractVideoId(input) {
  if (!input) return null;
  const str = input.trim();

  const match = str.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube-nocookie\.com\/embed\/|youtu\.be\/)([\w-]{11})/
  );
  if (match) return match[1];

  // Already looks like a bare 11-char video ID
  if (/^[\w-]{11}$/.test(str)) return str;

  return null;
}

/** Reads a single ?videos= param — a comma-separated list of full
 *  YouTube URLs and/or bare video IDs:
 *    ?videos=https://youtu.be/dQw4w9WgXcQ,https://youtu.be/xyz,abc12345678
 *  Returns an array of video IDs in the order given, skipping anything
 *  that couldn't be parsed. Empty array means "no specific videos
 *  requested" — the caller should fall back to playlist mode. */
export function getRequestedVideoIds() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('videos');
  if (!raw) return [];
  return raw.split(',').map(extractVideoId).filter(Boolean);
}

/** Fetches specific videos by ID (not tied to any playlist), through
 *  the /api/videos-by-id proxy. Normalizes the response into the same
 *  shape fetchVideos() returns (snippet.resourceId.videoId), so
 *  rendering code doesn't need to know or care which mode supplied
 *  the data. Results are reordered to match the requested ID order,
 *  since the API doesn't guarantee it back. */
export async function fetchVideosByIds(videoIds) {
  if (!videoIds || videoIds.length === 0) return [];

  const url = `/api/videos-by-id?ids=${encodeURIComponent(videoIds.join(','))}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || data.error || 'Could not load videos.');
  }

  const byId = new Map((data.items || []).map(item => [item.id, item]));

  return videoIds
    .map(id => byId.get(id))
    .filter(Boolean)
    .map(item => ({
      snippet: { ...item.snippet, resourceId: { videoId: item.id } },
    }));
}

export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Reads ?titleStyle= from the URL. 'regular' renders titles as a bolded
 *  paragraph matching body-text styling instead of the default h3
 *  heading — useful when the h3 heading scale doesn't fit a given
 *  embed. Anything else (including missing) falls back to 'heading'. */
export function getTitleStyle() {
  const params = new URLSearchParams(window.location.search);
  return params.get('titleStyle') === 'regular' ? 'regular' : 'heading';
}

/** Renders a video title as either an h3 heading (default) or a
 *  bolded body-style paragraph, per getTitleStyle(). title should
 *  already be HTML-escaped by the caller. */
export function titleMarkup(title, style) {
  return style === 'regular'
    ? `<p class="title-bold">${title}</p>`
    : `<h3 class="title">${title}</h3>`;
}

/** Minimal HTML-escaping for titles interpolated into innerHTML. */
export function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
