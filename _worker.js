/**
 * _worker.js — YouTube API proxy for CERG YouTube Feed
 *
 * Routes:
 *   GET /api/videos?playlist_id=UU...&max_results=12
 *     — latest N videos from a playlist (uploads feed, topic playlists, etc.)
 *
 *   GET /api/videos-by-id?ids=ID1,ID2,ID3
 *     — specific videos by ID, any order, not tied to any playlist.
 *       Used by latest-videos.html's ?video=<url> mode.
 *
 * Both inject the encrypted YOUTUBE_API_KEY server-side and pass the
 * raw YouTube Data API v3 response straight through to the frontend.
 *
 * Required secret:  YOUTUBE_API_KEY  (set in Pages Settings → Variables and Secrets)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/videos") {
      return handleVideos(request, env);
    }

    if (url.pathname === "/api/videos-by-id") {
      return handleVideosByIds(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleVideos(request, env) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return json({ error: "Server missing YouTube API key. Add YOUTUBE_API_KEY in Settings > Variables and Secrets." }, 500);
  }

  const params = new URL(request.url).searchParams;
  const playlistId = params.get("playlist_id");
  if (!playlistId) {
    return json({ error: "Missing playlist_id parameter." }, 400);
  }

  const maxResults = params.get("max_results") || "4";

  try {
    const ytUrl = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=" + maxResults + "&playlistId=" + playlistId + "&key=" + apiKey;
    const ytRes = await fetch(ytUrl);

    const body = await ytRes.text();
    return new Response(body, {
      status: ytRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (err) {
    return json({ error: "Unexpected error", detail: String(err) }, 500);
  }
}

async function handleVideosByIds(request, env) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return json({ error: "Server missing YouTube API key. Add YOUTUBE_API_KEY in Settings > Variables and Secrets." }, 500);
  }

  const params = new URL(request.url).searchParams;
  const ids = params.get("ids");
  if (!ids) {
    return json({ error: "Missing ids parameter." }, 400);
  }

  try {
    // videos.list accepts up to 50 comma-separated IDs in one call.
    const ytUrl = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + encodeURIComponent(ids) + "&key=" + apiKey;
    const ytRes = await fetch(ytUrl);

    const body = await ytRes.text();
    return new Response(body, {
      status: ytRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (err) {
    return json({ error: "Unexpected error", detail: String(err) }, 500);
  }
}

function json(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign(
      {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      extraHeaders || {}
    ),
  });
}
