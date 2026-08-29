import {
  getFeedConfig, fetchVideos,
  getRequestedVideoIds, fetchVideosByIds,
  getTitleStyle, titleMarkup,
  fmtDate, escapeHtml,
} from './feed.js';

// Used only when no ?videos= param is present and the URL doesn't
// specify ?playlist=/?max= either.
const DEFAULTS = {
  playlistId: 'UURAuV8XqQM0MD3VK_Pi32AA',
  maxResults: 3,
};

const grid = document.getElementById('grid');

function embedIframe(thumbWrap, videoId, title) {
  thumbWrap.innerHTML = `
    <iframe
      src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0"
      title="${escapeHtml(title)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen>
    </iframe>
  `;
}

function renderCard(item, titleStyle) {
  const s = item.snippet;
  const videoId = s.resourceId.videoId;
  const thumb = s.thumbnails?.medium?.url || s.thumbnails?.default?.url;

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="thumb-wrap" role="button" tabindex="0" aria-label="Play ${escapeHtml(s.title)}">
      <img src="${thumb}" alt="" loading="lazy">
      <span class="play-glyph">
        <svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
      </span>
    </div>
    <div class="meta">
      ${titleMarkup(escapeHtml(s.title), titleStyle)}
      <p class="date">${fmtDate(s.publishedAt)}</p>
    </div>
  `;

  const thumbWrap = card.querySelector('.thumb-wrap');
  const play = () => embedIframe(thumbWrap, videoId, s.title);
  thumbWrap.addEventListener('click', play, { once: true });
  thumbWrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
  }, { once: true });

  return card;
}

async function init() {
  try {
    // ?videos=... (comma-separated) always wins over playlist mode when
    // present. Examples:
    //   latest-videos-styled.html?videos=https://youtu.be/dQw4w9WgXcQ
    //   latest-videos-styled.html?videos=https://youtu.be/aaa,https://youtu.be/bbb,dQw4w9WgXcQ
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
    items.forEach(item => grid.appendChild(renderCard(item, titleStyle)));

  } catch (err) {
    grid.innerHTML = `<p class="status error">${escapeHtml(err.message || 'Something went wrong loading the video list.')}</p>`;
  }
}

init();
