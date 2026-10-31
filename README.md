# RateMyCity — Greater Noida

Hyperlocal, student-first reviews of dhabas, PGs, coaching centres, cafés and transport in Greater Noida. Each place gets an AI sentiment score, a "vibe summary", trending and hidden-gem badges.

## Features

- Discover, Trending, Hidden Gems and Map views
- Category filters, search and sorting
- Write a review: AI sentiment analysis (with a keyword-based fallback when AI is off)
- AI-generated vibe summaries per place
- Trending score with recency weighting, and hidden-gem detection
- Works with no backend: ships with sample data

## Tech

React 18 + Vite. Optional Claude AI through a serverless proxy (`api/claude.js`). An optional Express/MongoDB backend is started in `server/`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. Without an AI endpoint the app uses its offline sentiment fallback and the built-in summaries.

## Deploy

### Vercel (recommended: includes AI)

1. Import the repository in Vercel. It detects Vite automatically.
2. Add environment variables:
   - `ANTHROPIC_API_KEY`: your key (server-side only)
   - `VITE_AI_ENDPOINT` = `/api/claude`
3. Deploy. `api/claude.js` runs as a serverless function, so the key never reaches the browser.

### GitHub Pages (static, no AI)

The workflow `.github/workflows/pages.yml` builds and publishes `dist/`. Go to **Settings → Pages → Source: GitHub Actions** and push to `main`.

## Environment variables

See `.env.example`. Never commit a real `.env`.

## Project structure

```
index.html              Vite entry
src/main.jsx            React bootstrap
src/RateMyCity.jsx      the app
api/claude.js           serverless Claude proxy (keeps the API key server-side)
server/config/db.js     MongoDB connection helper (optional backend)
server/middleware/auth.js  JWT auth middleware (Bearer tokens)
docs/                   project report and planned structure
```

## Roadmap

The full REST backend (auth, places, reviews and trending endpoints, MongoDB models) is planned; `server/` holds its first pieces. See `docs/project-structure.md`.
