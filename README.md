# Rate My City · Greater Noida

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248?logo=mongodb&logoColor=white)
![Claude API](https://img.shields.io/badge/AI-Claude%20API-d97757)

A hyperlocal review platform where students rate the places they actually use in Greater Noida: PGs, dhabas, coaching centres, transport and services. Every review runs through sentiment analysis, and each place gets an AI-written "vibe summary", a trend score and a hidden-gem flag.

## Features

- **Discover**: browse by category, search names, sectors and tags, and sort by trending, rating, review count or sentiment.
- **Trending**: places ranked by recent sentiment, review velocity and rating.
- **Hidden gems**: places that are loved but haven't been widely discovered yet.
- **Live sentiment preview**: while you type a review you see its sentiment, a confidence score and its themes.
- **AI vibe summaries**: short, honest summaries generated from recent reviews and refreshed whenever a new review arrives.
- **Demo mode**: if the API is unreachable, the client runs on sample data and saves new reviews in your browser.

## Architecture

```
┌──────────────────────┐   /api/*    ┌───────────────────────────┐
│  client (React/Vite) │ ──────────▶ │  server (Express)         │
│  RateMyCity.jsx      │             │  routes/ → services/      │
│  services/api.js     │ ◀────────── │   ├─ scoring.js (pure)    │
└──────────────────────┘    JSON     │   └─ ai.js ──▶ Claude API │
                                     │  models/ ──▶ MongoDB      │
                                     └───────────────────────────┘
```

When a review is posted, the server:

1. validates the review, then scores its sentiment with Claude (or with a keyword heuristic when no API key is set);
2. stores it and updates the place's running averages, trend score and hidden-gem flag;
3. returns the review and the updated place right away, then regenerates the vibe summary in the background.

The Anthropic API key stays on the server. The browser never calls the Claude API directly.

## AI & Scoring

All formulas live in [`server/services/scoring.js`](server/services/scoring.js) and are unit tested.

| Signal | Definition |
| --- | --- |
| Recency weight | `w = 0.5 ^ (ageDays / 14)`: a review's weight halves every 14 days |
| Recent sentiment | Recency-weighted mean of review sentiment over the last 30 days |
| Review velocity | `min(1, reviewsInLast7Days / 5)` |
| **Trend score** | `0.4 × recentSentiment + 0.3 × velocity + 0.3 × (rating / 5)` |
| **Hidden gem** | sentiment ≥ 0.85, fewer than 75 reviews, rating ≥ 4.2, and recent sentiment not below the overall score |

Sentiment comes back from Claude as schema-validated JSON (`score`, `label`, `themes`, `confidence`). Review text is passed as delimited data and never treated as instructions. If a call fails or the API key is missing, the app falls back to a heuristic, so it keeps working without AI.

## Getting Started

**Requirements:** Node.js 20+ and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd server
cp .env.example .env        # then fill in MONGO_URI and JWT_SECRET
npm install
npm run seed                # loads sample places and reviews
npm run dev                 # http://localhost:5000

# 2. Client (in a second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173, proxies /api to :5000
```

To try only the UI, run the client by itself. It switches to demo mode automatically.

## Environment Variables (`server/.env`)

| Key | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used to sign auth tokens |
| `PORT` | no | API port (default `5000`) |
| `CLIENT_ORIGIN` | no | Allowed CORS origin (default `http://localhost:5173`) |
| `ANTHROPIC_API_KEY` | no | Enables Claude sentiment analysis and vibe summaries |
| `CLAUDE_MODEL` | no | Overrides the Claude model (default `claude-opus-5-5`) |

On the client, `VITE_API_URL` can point the built app at a deployed API (default `/api`).

## Project Structure

```
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── RateMyCity.jsx        # UI: discover, trending, gems, map, place detail
│       ├── services/api.js       # API client + offline demo mode
│       └── data/seed.json        # sample places & reviews (also used by the seed script)
└── server/
    ├── index.js / app.js         # entry point / Express app
    ├── config/db.js              # Mongoose connection
    ├── middleware/auth.js        # JWT auth (required + optional)
    ├── models/                   # User, Place, Review
    ├── routes/                   # auth, places (+reviews), ai
    ├── services/                 # ai.js (Claude), scoring.js (trend & gems)
    ├── seed.js
    └── test/
```

## API Reference

Base URL: `/api`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | none | Health check |
| POST | `/auth/register` | none | `{ username, email, password, college? }` → `{ token, user }` |
| POST | `/auth/login` | none | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | required | Current user |
| GET | `/places` | none | Query: `category`, `q`, `sort` (`trending`, `rating`, `reviews`, `newest`) |
| GET | `/places/trending` | none | Top 20 by trend score |
| GET | `/places/hidden-gems` | none | Places flagged as hidden gems |
| GET | `/places/:id` | none | One place |
| GET | `/places/:id/reviews` | none | Latest 100 reviews |
| POST | `/places/:id/reviews` | optional | `{ rating, text, username }`. A logged-in user's username takes priority over the one in the body |
| POST | `/places/:id/vibe` | none | Regenerate the vibe summary |
| GET | `/ai/status` | none | Whether Claude is configured |
| POST | `/ai/sentiment` | none | `{ text }` → sentiment preview |

Tokens are sent as `Authorization: Bearer <token>`.

## Database Schema

| Collection | Key fields |
| --- | --- |
| `users` | `username` (unique), `email` (unique), `passwordHash` (bcrypt, hidden by default), `college` |
| `places` | `name`, `category`, `location { address, sector, coordinates }`, `averageRating`, `sentimentScore`, `totalReviews`, `trendScore`, `isHiddenGem`, `priceRange`, `tags`, `vibeSummary`, `hours` |
| `reviews` | `placeId`, `userId?`, `username`, `rating` (1-5), `text` (20-2000 chars), `sentimentScore`, `sentimentLabel`, `themes` |

## Security

- The Claude API key is kept on the server, and AI calls go through rate-limited endpoints.
- Passwords are hashed with bcrypt (cost 12). JWTs expire after 7 days.
- `helmet` sets security headers, CORS is limited to the configured client origin, and JSON bodies are capped at 20 kB.
- Writes are rate limited (30 per 15 minutes per IP) and AI endpoints too (20 per minute).
- All input is validated: ObjectIds, rating range, text length, handle format. Search input is regex-escaped.

## Testing

```bash
cd server && npm test     # scoring formulas and sentiment fallback
cd client && npm run build
```

## Roadmap

- Real map view with coordinates (Leaflet / Mapbox)
- Login UI in the client, plus a review history for each user
- Photo uploads for places
- Upvotes and moderation for reviews
- Scheduled trend recalculation so that inactive places decay over time
- Support for more cities
