/**
 * iframe.js — shared loader for SFU CERG YouTube feed embeds.
 *
 * Two jobs:
 *   1. Builds each embed's query string from friendly data-attributes,
 *      so editors never have to hand-construct or percent-encode a URL.
 *   2. Listens for height-resize messages from the embedded page and
 *      resizes the iframe to match.
 *
 * Usage in AEM — start with all four attributes empty:
 *
 *   <iframe class="sfu-video-embed"
 *     src="https://cerg-youtube-feed.pages.dev/latest-videos-styled"
 *     data-videos=""
 *     data-playlist=""
 *     data-max-videos=""
 *     data-title-style=""
 *     title="CERG Youtube Feed" width="100%" height="800px" frameborder="no"
 *     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
 *     style="border-style: none; overflow: hidden; transition: height 0.2s ease;">
 *   </iframe>
 *   <script src="https://www.sfu.ca/.../iframe.js"></script>
 *
 * - Leave all four empty to use that page's own built-in defaults.
 * - Fill in data-playlist (and optionally data-max-videos) to pull
 *   from a specific playlist.
 * - Fill in data-videos (comma-separated YouTube URLs or bare video
 *   IDs) to show specific videos instead — paste full messy URLs as-is,
 *   no encoding needed, this script handles that.
 * - If BOTH data-videos and data-playlist are filled in, data-videos
 *   wins — matches the destination page's own ?videos= overriding
 *   ?playlist=/?max= behavior.
 * - Set data-title-style="bold" to render each video's title as a
 *   bolded paragraph matching the body font instead of the default
 *   h3 heading — useful when the heading scale doesn't fit. Leave
 *   empty (or anything other than "bold") for the default heading.
 *
 * Works automatically for any current or future page hosted on the
 * same project (latest-videos, latest-videos-styled, and anything
 * added later) — nothing here is tied to a specific page.
 */

(function () {
  // The Cloudflare Pages domain hosting the feed pages — used both to
  // build each embed's src and to validate incoming resize messages.
  var ALLOWED_ORIGIN = 'https://cerg-youtube-feed.pages.dev';

  function buildEmbedUrl(iframe) {
    var baseUrl = iframe.src.split('?')[0];
    if (!baseUrl) {
      console.warn('[iframe.js] No src found on', iframe);
      return null;
    }

    var videos = (iframe.dataset.videos || '').trim();
    var playlist = (iframe.dataset.playlist || '').trim();
    var maxVideos = (iframe.dataset.maxVideos || '').trim();
    var titleStyle = (iframe.dataset.titleStyle || '').trim();

    console.log('[iframe.js] Read from element —', {
      videos: videos,
      playlist: playlist,
      maxVideos: maxVideos,
      titleStyle: titleStyle
    });

    var params = new URLSearchParams();

    if (videos) {
      // Specific videos always wins over playlist — same precedence
      // as the destination page's own ?videos= vs ?playlist=.
      params.set('videos', videos);

    } else if (playlist) {
      // Accept either a full YouTube playlist URL or a bare playlist ID.
      var match = playlist.match(/[?&]list=([\w-]+)/);
      var playlistId = match ? match[1] : playlist;

      params.set('playlist', playlistId);

      if (maxVideos) params.set('max', maxVideos);
    }

    // If neither is set, no query string is added — the destination
    // page falls back to its own built-in defaults.

    if (titleStyle) params.set('titleStyle', titleStyle);

    var query = params.toString();
    var finalUrl = query ? baseUrl + '?' + query : baseUrl;

    console.log('[iframe.js] Built URL:', finalUrl);
    return finalUrl;
  }

  function initEmbeds() {
    var iframes = document.querySelectorAll('iframe.sfu-video-embed');
    console.log('[iframe.js] Found', iframes.length, 'embed(s)');
    iframes.forEach(function (iframe) {
      var url = buildEmbedUrl(iframe);
      if (url) iframe.src = url;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmbeds);
  } else {
    initEmbeds();
  }

  // --- Auto-resize listener ---
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'sfu-video-embed-resize') return;
    if (event.origin !== ALLOWED_ORIGIN) return;

    var iframes = document.querySelectorAll('iframe.sfu-video-embed');
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === event.source) {
        iframes[i].style.height = event.data.height + 'px';
        break;
      }
    }
  });
})();
