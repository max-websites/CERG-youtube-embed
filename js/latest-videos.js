import { getFeedConfig, fetchVideos, fmtDate, escapeHtml } from './feed.js';

// Used only if the URL doesn't specify ?playlist=/?max=
const DEFAULTS = {
  playlistId: 'UURAuV8XqQM0MD3VK_Pi32AA',
  maxResults: 3,
};

const grid = document.getElementById('grid');

async function init() {
  const config = getFeedConfig(DEFAULTS);

  try {
    const items = await fetchVideos(config);

    if (items.length === 0) {
      grid.innerHTML = '<p class="status">No videos found for this playlist.</p>';
      return;
    }

    grid.innerHTML = '';

    items.forEach((item) => {
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
        <p class="title">${escapeHtml(s.title)}</p>
        <p class="date">${fmtDate(s.publishedAt)}</p>
      `;
      grid.appendChild(el);
    });
  } catch (err) {
    grid.innerHTML = `<p class="status error">${escapeHtml(err.message || 'Something went wrong loading the video list.')}</p>`;
  }
}

init();
