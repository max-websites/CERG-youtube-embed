# CERG YouTube Feed

Static HTML page showing your latest YouTube videos. The YouTube Data API v3 key
is stored as an **encrypted secret** in Cloudflare Pages and never reaches the
browser. The frontend calls `/api/videos` on the same origin; the `_worker.js`
proxy injects the key and passes the raw YouTube response through.

## Architecture

```
Browser ──GET /──> Pages static assets (index.html)
Browser ──GET /api/videos──> _worker.js ──(secret key)──> YouTube Data API v3 ──> JSON
```

## Files

- `index.html` — the page (inline CSS + JS). Edit the CONFIG block at the top of the `<script>`.
- `_worker.js` — the proxy. Reads `YOUTUBE_API_KEY` from the encrypted environment.

## Deploy via GitHub (recommended)

1. Push both files to a GitHub repo.
2. In the Cloudflare dashboard, go to your Pages project → **Settings** → **Connect to Git**.
3. Select the repo. Build settings:
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (root)
4. Save and deploy. Future updates = just `git push`.

## Set the secret

The API key is an encrypted secret — set it in the dashboard:

**Settings → Variables and Secrets → Add**
- Variable name: `YOUTUBE_API_KEY`
- Value: *(your YouTube Data API v3 key)*
- Select **Encrypt**

## Configure the playlist

Edit `PLAYLIST_ID` in the CONFIG block at the top of the `<script>` in `index.html`.
Use your channel ID with `UC` swapped for `UU` (e.g. `UCpZy_t0WYVlm32-NojxVACQ` → `UUpZy_t0WYVlm32-NojxVACQ`).
