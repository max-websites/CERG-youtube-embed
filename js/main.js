/* ============================================================
   CONFIG — the only two lines you need to edit
   (API key lives server-side in your Cloudflare function)
   ============================================================ */
const PLAYLIST_ID = "UURAuV8XqQM0MD3VK_Pi32AA";    // channel ID with UC swapped for UU
const MAX_RESULTS = 4;                            // how many videos to show
/* ============================================================ */

const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const player = document.getElementById('player');
const countEl = document.getElementById('count');

function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
}

function playVideo(videoId, cardEl){
  player.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
  if (cardEl) cardEl.classList.add('active');
  player.closest('.player-shell').scrollIntoView({ behavior:'smooth', block:'start' });
}

async function loadVideos(){
  if (!PLAYLIST_ID || PLAYLIST_ID.startsWith('YOUR_')){
    statusEl.textContent = 'Add your playlist ID in the CONFIG block at the top of the script.';
    statusEl.classList.add('error');
    return;
  }

  // Fetch from our own proxy — the API key is injected server-side.
  const url = `/api/videos?playlist_id=${PLAYLIST_ID}&max_results=${MAX_RESULTS}`;

  try{
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error){
      statusEl.textContent = data.error?.message || data.error || 'Could not load videos. Check your playlist ID.';
      statusEl.classList.add('error');
      return;
    }

    const items = (data.items || []).filter(i => i.snippet?.resourceId?.videoId);
    if (items.length === 0){
      statusEl.textContent = 'No videos found for this playlist.';
      return;
    }

    grid.innerHTML = '';
    countEl.textContent = `${items.length} video${items.length === 1 ? '' : 's'}`;

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
          <span class="index-badge">${String(i+1).padStart(2,'0')}</span>
          <span class="play-glyph">
            <svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </div>
        <div class="meta">
          <p class="title">${s.title}</p>
          <p class="date">${fmtDate(s.publishedAt)}</p>
        </div>
      `;
      card.addEventListener('click', () => playVideo(videoId, card));
      grid.appendChild(card);

      if (i === 0) playVideo(videoId, card); // load latest video by default
    });

  } catch(err){
    statusEl.textContent = 'Something went wrong loading the video list.';
    statusEl.classList.add('error');
  }
}

loadVideos();