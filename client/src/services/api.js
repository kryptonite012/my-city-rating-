// Talks to the Express API. If the API isn't reachable (e.g. running the
// client on its own), falls back to an offline demo mode backed by the seed
// data, with new reviews saved to localStorage.
import seed from "../data/seed.json";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const STORAGE_KEY = "rate-my-city:offline:v1";
const DAY_MS = 86400000;

let onlinePromise = null;
export function isOnline() {
  if (!onlinePromise) {
    onlinePromise = fetch(`${API_BASE}/health`)
      .then(r => r.ok)
      .catch(() => false);
  }
  return onlinePromise;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.msg || `Request failed (${res.status})`);
  return body;
}

// ─── OFFLINE STORE ───────────────────────────────────────────────────────────
function seedStore() {
  const reviews = {};
  for (const [id, list] of Object.entries(seed.reviews)) {
    reviews[id] = list.map(({ daysAgo, ...r }) => ({ ...r, createdAt: new Date(Date.now() - daysAgo * DAY_MS).toISOString() }));
  }
  return { places: seed.places, reviews };
}

function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.places && saved?.reviews) return saved;
  } catch {
    // corrupt or unavailable storage: start fresh
  }
  return seedStore();
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage full or blocked: changes last for this session only
  }
}

let store = null;
const getStore = () => (store ??= loadStore());

const POSITIVE = ["great", "amazing", "good", "excellent", "love", "best", "perfect", "nice", "clean", "fast", "fresh", "helpful", "tasty", "safe", "affordable", "homely", "friendly"];
const NEGATIVE = ["bad", "terrible", "worst", "dirty", "slow", "expensive", "pathetic", "horrible", "awful", "rude", "unsafe", "overcharge", "overcharging", "annoying", "crowded"];

export function heuristicSentiment(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/);
  const pos = words.filter(w => POSITIVE.includes(w)).length;
  const neg = words.filter(w => NEGATIVE.includes(w)).length;
  const score = (pos + 1) / (pos + neg + 2);
  return { score, label: score > 0.6 ? "positive" : score < 0.4 ? "negative" : "neutral", themes: [], confidence: 0.3, source: "heuristic" };
}

function offlineVibe(reviews) {
  if (!reviews.length) return "No reviews yet - be the first to share the vibe.";
  const avg = reviews.reduce((a, r) => a + r.sentimentScore, 0) / reviews.length;
  const themes = [...new Set(reviews.flatMap(r => r.themes || []))].slice(0, 3);
  const mood = avg > 0.7 ? "Students are loving it" : avg > 0.45 ? "Opinions are mixed" : "Reviewers have real concerns";
  return `${mood} (${Math.round(avg * 100)}% positive across ${reviews.length} reviews)${themes.length ? `. People keep talking about ${themes.join(", ")}.` : "."}`;
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────
export async function fetchPlaces() {
  if (await isOnline()) return request("/places");
  return getStore().places;
}

export async function fetchReviews(placeId) {
  if (await isOnline()) return request(`/places/${placeId}/reviews`);
  return getStore().reviews[placeId] || [];
}

export async function previewSentiment(text) {
  if (await isOnline()) {
    try {
      return await request("/ai/sentiment", { method: "POST", body: JSON.stringify({ text }) });
    } catch {
      // rate limited or AI unavailable: fall through to the local heuristic
    }
  }
  return heuristicSentiment(text);
}

// Returns { review, place } with the place's updated aggregates.
export async function submitReview(placeId, { rating, text, username }) {
  if (await isOnline()) {
    return request(`/places/${placeId}/reviews`, { method: "POST", body: JSON.stringify({ rating, text, username }) });
  }
  const s = getStore();
  const sentiment = heuristicSentiment(text);
  const review = {
    _id: `local_${Date.now()}`, username, rating, text,
    sentimentScore: sentiment.score, sentimentLabel: sentiment.label, themes: sentiment.themes,
    createdAt: new Date().toISOString(),
  };
  const reviews = [review, ...(s.reviews[placeId] || [])];
  let updatedPlace = null;
  const places = s.places.map(p => {
    if (p._id !== placeId) return p;
    const n = p.totalReviews;
    updatedPlace = {
      ...p,
      totalReviews: n + 1,
      averageRating: (p.averageRating * n + rating) / (n + 1),
      sentimentScore: (p.sentimentScore * n + review.sentimentScore) / (n + 1),
    };
    return updatedPlace;
  });
  store = { places, reviews: { ...s.reviews, [placeId]: reviews } };
  saveStore(store);
  return { review, place: updatedPlace };
}

export async function refreshVibe(placeId) {
  if (await isOnline()) {
    const { vibeSummary } = await request(`/places/${placeId}/vibe`, { method: "POST" });
    return vibeSummary;
  }
  const s = getStore();
  const vibeSummary = offlineVibe(s.reviews[placeId] || []);
  store = { ...s, places: s.places.map(p => (p._id === placeId ? { ...p, vibeSummary } : p)) };
  saveStore(store);
  return vibeSummary;
}

export function resetOfflineData() {
  store = seedStore();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}
