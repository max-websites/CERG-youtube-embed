import { getFeedConfig, fetchVideos, getTitleStyle, titleMarkup, fmtDate, escapeHtml } from './feed.js';

// Used only if the URL doesn't specify ?playlist=/?max=
const DEFAULTS = {
  playlistId: 'UURAuV8XqQM0MD3VK_Pi32AA',
  maxResults: 4,
};

const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const player = document.getElementById('player');
const countEl = document.getElementById('count');

function playVideo(videoId, cardEl) {
  player.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
  if (cardEl) cardEl.classList.add('active');
  player.closest('.player-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function init() {
  const config = getFeedConfig(DEFAULTS);

  try {
    const items = await fetchVideos(config);

    if (items.length === 0) {
      statusEl.textContent = 'No videos found for this playlist.';
      return;
    }

    grid.innerHTML = '';
    countEl.textContent = `${items.length} video${items.length === 1 ? '' : 's'}`;
    const titleStyle = getTitleStyle();

    items.forEach((item, i) => {
      const s = item.snippet;
      const videoId = s.resourceId.videoId;
      const thumb = s.thumbnails?.medium?.url || s.thumbnails?.default?.url;

      const card = document.createElement('button');
      card.className = 'card';
      card.setAttribute('aria-label', `Play ${s.title}`);
      card.innerHTML = `
        <div class="thumb-wrap">
          <img src="${thumb}" alt="" loading="lazy">
          <span class="index-badge">${String(i + 1).padStart(2, '0')}</span>
          <span class="play-glyph">
            <svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </div>
        <div class="meta">
          ${titleMarkup(escapeHtml(s.title), titleStyle)}
          <p class="date">${fmtDate(s.publishedAt)}</p>
        </div>
      `;
      card.addEventListener('click', () => playVideo(videoId, card));
      grid.appendChild(card);

      if (i === 0) playVideo(videoId, card); // load latest video by default
    });
  } catch (err) {
    statusEl.textContent = err.message || 'Something went wrong loading the video list.';
    statusEl.classList.add('error');
  }
}

init();
