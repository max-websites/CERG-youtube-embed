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

export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Minimal HTML-escaping for titles interpolated into innerHTML. */
export function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
