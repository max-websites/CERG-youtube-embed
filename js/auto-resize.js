/* ============================================================
   auto-resize.js — reports this page's content height to the
   parent window, so a cross-origin AEM iframe can resize itself
   to fit. JS can't read across origins directly (that's what
   threw the SecurityError) — postMessage is the sanctioned way
   around that boundary, and it requires a listener on BOTH the
   parent page (in AEM) and this page.

   Include this on every page meant to sit in an auto-sizing
   AEM iframe: index.html, latest-videos.html,
   latest-videos-styled.html, and any future topic pages.
   ============================================================ */

let scheduled = false;

function reportHeight() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    const height = Math.ceil(document.documentElement.scrollHeight);
    // '*' because this page may be embedded from author, staging,
    // or production AEM — we're only ever sending a plain number,
    // so an open target origin here is low-risk. The parent-side
    // listener is what validates origin before acting on it.
    window.parent.postMessage({ type: 'sfu-video-embed-resize', height }, '*');
  });
}

window.addEventListener('load', reportHeight);
window.addEventListener('resize', reportHeight);

// Catches everything a plain load/resize listener would miss:
// the fetched grid rendering in after "Loading videos…", an
// inline embed swapping in on click, fonts finishing their swap.
new ResizeObserver(reportHeight).observe(document.body);
