import {
  getFeedConfig, fetchVideos,
  getRequestedVideoIds, fetchVideosByIds,
  getTitleStyle, titleMarkup,
  fmtDate, escapeHtml,
  getRequestedPlaylistId,
} from './feed.js';

// Only used when a playlist IS given but ?max= isn't — there's no
// default playlist anymore, so "nothing configured" means nothing
// shown, not a fallback channel.
const DEFAULTS = {
  maxResults: 2,
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
  card.role = 'button';
  card.tabIndex = 0;
  card.ariaLabel = `Play ${escapeHtml(s.title)}`;
  card.innerHTML = `
    <div class="thumb-wrap">
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

  const thumbWrap = card.querySelector('.card');
  const play = () => embedIframe(thumbWrap, videoId, s.title);
  thumbWrap.addEventListener('click', play, { once: true });
  thumbWrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
  }, { once: true });

  return card;
}

async function init() {
  const requestedIds = getRequestedVideoIds();
  const requestedPlaylist = getRequestedPlaylistId();

  // Nothing configured at all — leave the iframe completely blank,
  // not even a status message.
  if (requestedIds.length === 0 && !requestedPlaylist) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = '<p class="status">Loading videos\u2026</p>';

  try {
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
