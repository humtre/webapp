# humtre

Personal music player. Stream your library from anywhere.

## Stack

- **Frontend**: Vite + React + TypeScript
- **Likes API**: Vercel Serverless Functions + Upstash Redis
- **Hosting**: Vercel ([humtre.vercel.app](https://humtre.vercel.app))

## Features

- GCS-backed audio streaming (proxied through backend)
- Likes system (click +1, long press -1) persisted in Redis
- Weighted shuffle (liked tracks play more often)
- 3 shuffle modes: likes-weighted → random → sequential
- Sidebar search + 4-way sort (likes/alpha × asc/desc)
- Media Session API (lock screen controls, artwork, like count)
- Keyboard shortcuts (space, arrows, f/F for likes, n/p, m)
- Mobile-first responsive layout

## Development

```bash
npm install
npm run dev          # Vite dev server (port 5173)
```

Likes API requires Upstash Redis env vars (`KV_REST_API_URL`, `KV_REST_API_TOKEN`).
Locally, likes work in-memory only. For persistence, deploy to Vercel or use `vercel dev`.

## Deploy

```bash
vercel deploy --prod
```

Backend env var: `VITE_SEARCH_SERVICE_URL` (Cloud Run URL).

## Related

- [humtre/search](https://github.com/humtre/search) — FastAPI backend (streaming, indexing, hum-to-search)
