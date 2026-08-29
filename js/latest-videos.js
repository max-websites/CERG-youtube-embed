import {
  getFeedConfig, fetchVideos,
  getRequestedVideoIds, fetchVideosByIds,
  getTitleStyle, titleMarkup,
  fmtDate, escapeHtml,
} from './feed.js';

// Used only when no ?video= params are present and the URL doesn't
// specify ?playlist=/?max= either.
const DEFAULTS = {
  playlistId: 'UURAuV8XqQM0MD3VK_Pi32AA',
  maxResults: 3,
};

const grid = document.getElementById('grid');

function renderVideo(item, titleStyle) {
  const s = item.snippet;
  const videoId = s.resourceId.videoId;

  const el = document.createElement('div');
  el.className = 'video-item';
  el.innerHTML = `
    <div class="frame-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0"
        title="${escapeHtml(s.title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen>
      </iframe>
    </div>
    ${titleMarkup(escapeHtml(s.title), titleStyle)}
    <p class="date">${fmtDate(s.publishedAt)}</p>
  `;
  return el;
}

async function init() {
  try {
    // ?videos=... (comma-separated) always wins over playlist mode when
    // present. Examples:
    //   latest-videos.html?videos=https://youtu.be/dQw4w9WgXcQ
    //   latest-videos.html?videos=https://youtu.be/aaa,https://youtu.be/bbb,dQw4w9WgXcQ
    const requestedIds = getRequestedVideoIds();

    const items = requestedIds.length > 0
      ? await fetchVideosByIds(requestedIds)
      : await fetchVideos(getFeedConfig(DEFAULTS));

    if (items.length === 0) {
      grid.innerHTML = '<p class="status">No videos found.</p>';
      return;
    }

    grid.innerHTML = '';
    const titleStyle = getTitleStyle();
    items.forEach(item => grid.appendChild(renderVideo(item, titleStyle)));

  } catch (err) {
    grid.innerHTML = `<p class="status error">${escapeHtml(err.message || 'Something went wrong loading the video list.')}</p>`;
  }
}

init();
