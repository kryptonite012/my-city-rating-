import { useState, useEffect, useRef, useMemo } from "react";
import * as api from "./services/api";

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    trending: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
    gem: "M6 3h12l4 6-10 13L2 9z M2 9h20 M6 3l4 6 M18 3l-4 6",
    map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
    spark: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    food: "M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3",
    bed: "M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    bus: "M8 6v6 M15 6v6 M2 12h19.6 M18 18h3s.5-1.7.8-2.8c.3-1.2.2-3.3-2-3.3H4.3C2 12 2 13.8 2.3 15.1c.3 1.1.8 2.8.8 2.8H6 M7 18H4 M19 18h-3 M4 20a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M16 20a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
    settings: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    close: "M18 6L6 18 M6 6l12 12",
    back: "M19 12H5 M12 19l-7-7 7-7",
    up: "M12 19V5 M5 12l7-7 7 7",
    loader: "M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]?.split(" M ").map((d, i) => (
        <path key={i} d={i === 0 ? d : "M " + d} />
      ))}
    </svg>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const categoryMeta = {
  dhaba: { label: "Dhaba / Café", color: "#f97316", bg: "#fff7ed", icon: "food", emoji: "🍛" },
  pg: { label: "PG / Hostel", color: "#8b5cf6", bg: "#f5f3ff", icon: "bed", emoji: "🏠" },
  coaching: { label: "Coaching", color: "#06b6d4", bg: "#ecfeff", icon: "book", emoji: "📚" },
  transport: { label: "Transport", color: "#10b981", bg: "#ecfdf5", icon: "bus", emoji: "🚌" },
  service: { label: "Services", color: "#f59e0b", bg: "#fffbeb", icon: "settings", emoji: "🛠️" },
};

function StarDisplay({ rating, size = 14 }) {
  return (
    <span style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

function SentimentBar({ score }) {
  const color = score > 0.7 ? "#10b981" : score > 0.45 ? "#f59e0b" : "#ef4444";
  const label = score > 0.7 ? "Positive" : score > 0.45 ? "Neutral" : "Mixed";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${score * 100}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "monospace", minWidth: 50 }}>{label}</span>
    </div>
  );
}

function Badge({ children, color = "#8b5cf6", bg = "#f5f3ff" }) {
  return (
    <span style={{ display: "inline-block", background: bg, color, border: `1px solid ${color}33`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function timeAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function truncate(text = "", max = 120) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

// Makes a clickable div reachable and usable from the keyboard.
const clickable = (onActivate) => ({
  role: "button",
  tabIndex: 0,
  onClick: onActivate,
  onKeyDown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActivate(); } },
});

const priceLabel = { budget: "💰 Budget", mid: "💰💰 Mid", premium: "💰💰💰 Premium" };

// ─── PLACE CARD ───────────────────────────────────────────────────────────────
function PlaceCard({ place, onClick }) {
  const meta = categoryMeta[place.category] || categoryMeta.service;
  return (
    <div {...clickable(() => onClick(place))} style={{
      background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
      padding: 20, cursor: "pointer", transition: "all 0.2s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      display: "flex", flexDirection: "column", gap: 12,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color }}>
            <Icon name={meta.icon} size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827", fontFamily: "'Playfair Display', Georgia, serif" }}>{place.name}</h3>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{place.location.sector}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          {place.isHiddenGem && <Badge color="#7c3aed" bg="#ede9fe">💎 Hidden Gem</Badge>}
          <Badge color={meta.color} bg={meta.bg}>{meta.label}</Badge>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6, fontStyle: "italic" }}>
        "{truncate(place.vibeSummary)}"
      </p>

      <SentimentBar score={place.sentimentScore} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StarDisplay rating={place.averageRating} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{place.averageRating.toFixed(1)}</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>({place.totalReviews} reviews)</span>
        </div>
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {priceLabel[place.priceRange] || priceLabel.budget}
        </span>
      </div>
    </div>
  );
}

// ─── REVIEW CARD ──────────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  const colors = { positive: "#10b981", neutral: "#f59e0b", negative: "#ef4444" };
  const color = colors[review.sentimentLabel] || "#6b7280";
  return (
    <div style={{ background: "#f9fafb", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>
            {review.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>@{review.username}</span>
            <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
              <StarDisplay rating={review.rating} size={12} />
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, padding: "2px 8px", borderRadius: 99 }}>
            {review.sentimentLabel?.toUpperCase()}
          </span>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{timeAgo(review.createdAt)}</div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{review.text}</p>
      {review.themes?.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
          {review.themes.map(t => <Badge key={t} color="#6b7280" bg="#f3f4f6">#{t}</Badge>)}
        </div>
      )}
    </div>
  );
}

// ─── REVIEW FORM ──────────────────────────────────────────────────────────────
function ReviewForm({ place, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleTextChange = (val) => {
    setText(val);
    clearTimeout(debounceRef.current);
    // Any in-flight preview is now stale; bumping the id makes its result be ignored.
    const requestId = ++requestIdRef.current;
    if (val.trim().length > 15) {
      debounceRef.current = setTimeout(async () => {
        setAnalyzing(true);
        const result = await api.previewSentiment(val);
        if (requestId !== requestIdRef.current) return;
        setPreview(result);
        setAnalyzing(false);
      }, 1200);
    } else {
      setPreview(null);
      setAnalyzing(false);
    }
  };

  const handle = name.trim();
  const validHandle = /^[\w.-]{2,30}$/.test(handle);
  const canSubmit = rating > 0 && text.trim().length >= 20 && validHandle && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(await api.submitReview(place._id, { rating, text: text.trim(), username: handle }));
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sentColor = preview ? (preview.label === "positive" ? "#10b981" : preview.label === "negative" ? "#ef4444" : "#f59e0b") : "#6b7280";

  if (done) return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
      <h3 style={{ color: "#111827", margin: "0 0 8px" }}>Review submitted!</h3>
      <p style={{ color: "#6b7280", fontSize: 14 }}>AI is analysing your review and updating the vibe summary...</p>
      <button onClick={onClose} style={{ marginTop: 16, padding: "10px 24px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Close</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>YOUR NAME / HANDLE</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aarav_GNIOT" maxLength={30} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        {name && !validHandle && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>2-30 characters: letters, numbers, _ . or -</div>}
      </div>

      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>YOUR RATING</label>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} width={32} height={32} viewBox="0 0 24 24"
              fill={(hover || rating) >= i ? "#f59e0b" : "none"}
              stroke="#f59e0b" strokeWidth="1.5" style={{ cursor: "pointer", transition: "transform 0.1s" }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
              aria-label={`${i} star${i > 1 ? "s" : ""}`} aria-pressed={rating === i}
              {...clickable(() => setRating(i))}
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>YOUR REVIEW</label>
        <textarea value={text} onChange={e => handleTextChange(e.target.value)} placeholder="Share your honest experience (min 20 chars)..." rows={4} maxLength={2000}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{text.length} / 2000 chars</div>
      </div>

      {(analyzing || preview) && (
        <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12, border: `1px solid ${sentColor}40` }}>
          {analyzing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: 13 }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚡</span> AI analysing sentiment...
            </div>
          ) : preview && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>🤖 SENTIMENT PREVIEW</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: sentColor }}>{preview.label?.toUpperCase()}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Score: {(preview.score * 100).toFixed(0)}%</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Confidence: {(preview.confidence * 100).toFixed(0)}%</span>
                {preview.source === "heuristic" && <span style={{ fontSize: 11, color: "#9ca3af" }}>(offline estimate)</span>}
              </div>
              {preview.themes?.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                  {preview.themes.map(t => <Badge key={t} color="#6b7280" bg="#e5e7eb">#{t}</Badge>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <div role="alert" style={{ fontSize: 13, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px" }}>{error}</div>}

      <button onClick={handleSubmit} disabled={!canSubmit}
        style={{ padding: "12px", background: canSubmit || submitting ? "#7c3aed" : "#d1d5db", color: "#fff", border: "none", borderRadius: 10, cursor: canSubmit ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {submitting ? "Submitting..." : <><Icon name="send" size={16} /> Submit Review</>}
      </button>
    </div>
  );
}

// ─── PLACE DETAIL ─────────────────────────────────────────────────────────────
function PlaceDetail({ place, onBack, onPlaceUpdate }) {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [vibeLoading, setVibeLoading] = useState(false);
  const [vibeError, setVibeError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");
  const meta = categoryMeta[place.category] || categoryMeta.service;

  useEffect(() => {
    let cancelled = false;
    setReviewsLoading(true);
    api.fetchReviews(place._id)
      .then(list => { if (!cancelled) setReviews(list); })
      .catch(() => { if (!cancelled) setReviews([]); })
      .finally(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [place._id]);

  const refreshVibe = async () => {
    setVibeLoading(true);
    setVibeError("");
    try {
      const vibeSummary = await api.refreshVibe(place._id);
      onPlaceUpdate({ ...place, vibeSummary });
    } catch (err) {
      setVibeError(err.message || "Couldn't refresh the summary right now.");
    } finally {
      setVibeLoading(false);
    }
  };

  const handleNewReview = async ({ review, place: updatedPlace }) => {
    setReviews(prev => [review, ...prev]);
    if (updatedPlace) onPlaceUpdate({ ...updatedPlace, vibeSummary: updatedPlace.vibeSummary || place.vibeSummary });
  };

  const counts = useMemo(() => reviews.reduce((acc, r) => ({ ...acc, [r.sentimentLabel]: (acc[r.sentimentLabel] || 0) + 1 }), {}), [reviews]);
  const visibleReviews = reviewFilter === "all" ? reviews : reviews.filter(r => r.sentimentLabel === reviewFilter);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14, marginBottom: 20, padding: 0 }}>
        <Icon name="back" size={16} /> Back to places
      </button>

      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}11)`, padding: 28, borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <Badge color={meta.color} bg={meta.bg}>{meta.label}</Badge>
                {place.isHiddenGem && <Badge color="#7c3aed" bg="#ede9fe">💎 Hidden Gem</Badge>}
              </div>
              <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 900, color: "#111827", fontFamily: "'Playfair Display', Georgia, serif" }}>{place.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 13 }}>
                <Icon name="location" size={14} /> {place.location.address}
              </div>
              <div style={{ display: "flex", gap: 12, color: "#6b7280", fontSize: 12, marginTop: 6, flexWrap: "wrap" }}>
                <span>{priceLabel[place.priceRange] || priceLabel.budget}</span>
                {place.hours?.open && <span>🕒 {place.hours.open === place.hours.close ? "Open 24 hours" : `${place.hours.open} – ${place.hours.close}`}</span>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{place.averageRating.toFixed(1)}</div>
              <StarDisplay rating={place.averageRating} size={18} />
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{place.totalReviews} reviews</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="spark" size={14} /> AI VIBE SUMMARY
              </span>
              <button onClick={refreshVibe} disabled={vibeLoading || reviews.length === 0} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#7c3aed", fontWeight: 700 }}>
                {vibeLoading ? "Refreshing..." : "Refresh ↻"}
              </button>
            </div>
            {vibeLoading ? (
              <div style={{ background: "#f5f3ff", borderRadius: 12, padding: 16, color: "#7c3aed", fontSize: 13, fontStyle: "italic" }}>
                ⚡ Generating new vibe summary from latest reviews...
              </div>
            ) : (
              <div style={{ background: "#f5f3ff", borderRadius: 12, padding: 16, color: "#374151", fontSize: 14, lineHeight: 1.7, fontStyle: "italic", borderLeft: "3px solid #7c3aed" }}>
                {place.vibeSummary || "No vibe summary yet."}
              </div>
            )}
            {vibeError && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 6 }}>{vibeError}</div>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>COMMUNITY SENTIMENT</div>
            <SentimentBar score={place.sentimentScore} />
          </div>

          {place.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {place.tags.map(t => <Badge key={t} color="#6b7280" bg="#f3f4f6">#{t}</Badge>)}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20 }}>Recent reviews</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 18px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
          {showForm ? "Cancel" : <><Icon name="send" size={14} /> Write Review</>}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontFamily: "'Playfair Display', Georgia, serif" }}>Share your experience</h3>
          <ReviewForm place={place} onSubmit={handleNewReview} onClose={() => setShowForm(false)} />
        </div>
      )}

      {reviews.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {["all", "positive", "neutral", "negative"].map(f => (
            <button key={f} onClick={() => setReviewFilter(f)} aria-pressed={reviewFilter === f} style={{
              padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${reviewFilter === f ? "#7c3aed" : "#e5e7eb"}`,
              background: reviewFilter === f ? "#7c3aed" : "#fff", color: reviewFilter === f ? "#fff" : "#374151",
            }}>
              {f === "all" ? `All (${reviews.length})` : `${f[0].toUpperCase()}${f.slice(1)} (${counts[f] || 0})`}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reviewsLoading && <div style={{ textAlign: "center", padding: 24, color: "#9ca3af", fontSize: 14 }}>Loading reviews…</div>}
        {visibleReviews.map(r => <ReviewCard key={r._id} review={r} />)}
        {!reviewsLoading && reviews.length > 0 && visibleReviews.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: "#9ca3af", fontSize: 14 }}>No {reviewFilter} reviews yet.</div>
        )}
        {!reviewsLoading && reviews.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>
            No reviews yet. Be the first to review!
          </div>
        )}
      </div>

    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f1f1f1; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .place-card-anim { animation: fadeUp 0.4s ease both; }
  [role="button"]:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; }
  @media (max-width: 640px) {
    .rmc-header { flex-wrap: wrap; height: auto !important; padding: 10px 16px !important; gap: 10px; }
    .rmc-search { width: 100% !important; }
    .rmc-nav { overflow-x: auto; padding: 0 8px !important; }
    .rmc-nav button { white-space: nowrap; padding: 14px 12px !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
`;

const SORT_OPTIONS = {
  trending: { label: "Trending", compare: (a, b) => b.trendScore - a.trendScore },
  rating: { label: "Top rated", compare: (a, b) => b.averageRating - a.averageRating },
  reviews: { label: "Most reviewed", compare: (a, b) => b.totalReviews - a.totalReviews },
  sentiment: { label: "Best vibes", compare: (a, b) => b.sentimentScore - a.sentimentScore },
};

export default function RateMyCity() {
  const [tab, setTab] = useState("home");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [offline, setOffline] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [search, setSearch] = useState("");

  const loadPlaces = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [list, online] = await Promise.all([api.fetchPlaces(), api.isOnline()]);
      setPlaces(list);
      setOffline(!online);
    } catch (err) {
      setLoadError(err.message || "Couldn't load places.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlaces(); }, []);

  const selectedPlace = places.find(p => p._id === selectedId) || null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return places
      .filter(p => filterCat === "all" || p.category === filterCat)
      .filter(p => !q || [p.name, p.location.sector, ...(p.tags || [])].some(v => v.toLowerCase().includes(q)))
      .sort(SORT_OPTIONS[sortBy].compare);
  }, [places, filterCat, search, sortBy]);
  const trending = useMemo(() => [...places].sort(SORT_OPTIONS.trending.compare), [places]);
  const gems = places.filter(p => p.isHiddenGem);

  const handlePlaceClick = (place) => {
    setSelectedId(place._id);
    window.scrollTo({ top: 0 });
  };

  const handlePlaceUpdate = (updated) => {
    setPlaces(prev => prev.map(p => (p._id === updated._id ? updated : p)));
  };

  // ── NAV ──
  const navItems = [
    { id: "home", icon: "home", label: "Discover" },
    { id: "trending", icon: "trending", label: "Trending" },
    { id: "gems", icon: "gem", label: "Hidden Gems" },
    { id: "map", icon: "map", label: "Map" },
  ];

  if (selectedPlace) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
        <style>{GLOBAL_STYLES}</style>
        <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#7c3aed,#ec4899)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>📍</div>
            <span style={{ fontWeight: 900, fontSize: 16, color: "#111827", fontFamily: "'Playfair Display', Georgia, serif" }}>Rate My City</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Greater Noida</span>
          </div>
        </header>
        <main style={{ padding: "24px 16px", maxWidth: 800, margin: "0 auto" }}>
          <PlaceDetail place={selectedPlace} onBack={() => setSelectedId(null)} onPlaceUpdate={handlePlaceUpdate} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>

      {/* HEADER */}
      <header className="rmc-header" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#7c3aed,#ec4899)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>📍</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: "#111827", fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.1 }}>Rate My City</div>
            <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 1 }}>GREATER NOIDA</div>
          </div>
        </div>
        <input className="rmc-search" type="search" aria-label="Search places" value={search}
          onChange={e => { setSearch(e.target.value); setTab("home"); }} placeholder="Search places, sectors or tags..."
          style={{ width: 260, padding: "8px 14px", borderRadius: 20, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#f9fafb" }} />
      </header>

      {/* NAV TABS */}
      <nav className="rmc-nav" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", display: "flex", gap: 4 }}>
        {navItems.map(({ id, icon, label }) => (
          <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} style={{ padding: "14px 18px", border: "none", background: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, color: tab === id ? "#7c3aed" : "#6b7280", borderBottom: tab === id ? "2px solid #7c3aed" : "2px solid transparent", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
            <Icon name={icon} size={15} /> {label}
          </button>
        ))}
      </nav>

      {offline && (
        <div role="status" style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", color: "#92400e", fontSize: 13, padding: "8px 24px", textAlign: "center" }}>
          Demo mode: the API isn't reachable, so you're seeing sample data. New reviews are saved in this browser only.
        </div>
      )}

      <main style={{ padding: "24px 16px", maxWidth: 900, margin: "0 auto" }}>
        {loading && <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading places…</div>}
        {loadError && (
          <div role="alert" style={{ textAlign: "center", padding: 40, color: "#b91c1c" }}>
            {loadError}{" "}
            <button onClick={loadPlaces} style={{ marginLeft: 8, padding: "6px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", color: "#b91c1c", fontWeight: 700, cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {/* HOME TAB */}
        {!loading && !loadError && tab === "home" && (
          <div>
            {/* Hero */}
            <div style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)", borderRadius: 20, padding: "32px 28px", marginBottom: 28, color: "#fff", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", bottom: -30, right: 60, width: 80, height: 80, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
              <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, fontFamily: "'Playfair Display', Georgia, serif" }}>Discover Greater Noida 🏙️</h1>
              <p style={{ margin: "0 0 20px", opacity: 0.85, fontSize: 15 }}>AI-powered reviews for students, by students. Real vibes. No filters.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>🏠 {places.filter(p => p.category === "pg").length} PGs</div>
                <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>🍛 {places.filter(p => p.category === "dhaba").length} Dhabas</div>
                <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>💎 {gems.length} Hidden Gems</div>
              </div>
            </div>

            {/* Category Filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
              {[{ id: "all", label: "All Places" }, ...Object.entries(categoryMeta).map(([id, m]) => ({ id, label: m.label }))].map(({ id, label }) => (
                <button key={id} onClick={() => setFilterCat(id)} style={{
                  padding: "8px 16px", borderRadius: 20, border: "1px solid",
                  borderColor: filterCat === id ? "#7c3aed" : "#e5e7eb",
                  background: filterCat === id ? "#7c3aed" : "#fff",
                  color: filterCat === id ? "#fff" : "#374151",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                }}>{label}</button>
              ))}
              <select aria-label="Sort places" value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ marginLeft: "auto", padding: "8px 12px", borderRadius: 20, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer" }}>
                {Object.entries(SORT_OPTIONS).map(([id, { label }]) => <option key={id} value={id}>Sort: {label}</option>)}
              </select>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {filtered.map((p, i) => (
                <div key={p._id} className="place-card-anim" style={{ animationDelay: `${i * 0.05}s` }}>
                  <PlaceCard place={p} onClick={handlePlaceClick} />
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#9ca3af" }}>
                  No places found. Try a different search or category.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRENDING TAB */}
        {!loading && !loadError && tab === "trending" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24 }}>🔥 Trending Now</h2>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Ranked by recent sentiment, review velocity & ratings. Updated with every new review.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {trending.map((p, i) => {
                const meta = categoryMeta[p.category] || categoryMeta.service;
                return (
                  <div key={p._id} {...clickable(() => handlePlaceClick(p))} className="place-card-anim" style={{ animationDelay: `${i * 0.06}s`, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: i < 3 ? "#7c3aed" : "#d1d5db", minWidth: 40, textAlign: "center", fontFamily: "'Playfair Display', Georgia, serif" }}>#{i + 1}</div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color }}>
                      <Icon name={meta.icon} size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{p.location.sector} · {meta.label}</div>
                      <SentimentBar score={p.sentimentScore} />
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>{p.averageRating.toFixed(1)}</div>
                      <StarDisplay rating={p.averageRating} size={12} />
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Trend: {(p.trendScore * 100).toFixed(0)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GEMS TAB */}
        {!loading && !loadError && tab === "gems" && (
          <div>
            <div style={{ background: "linear-gradient(135deg,#4c1d95,#7c3aed)", borderRadius: 20, padding: "28px", marginBottom: 28, color: "#fff" }}>
              <h2 style={{ margin: "0 0 8px", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24 }}>💎 Hidden Gems</h2>
              <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>AI-curated spots with high positive sentiment but low discovery. These are the places your seniors never told you about.</p>
              <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7, fontFamily: "monospace" }}>
                Criteria: Sentiment ≥ 85% · Reviews &lt; 75 · Rating ≥ 4.2 · Trending Up
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {gems.map((p, i) => (
                <div key={p._id} className="place-card-anim" style={{ animationDelay: `${i * 0.08}s` }}>
                  <PlaceCard place={p} onClick={handlePlaceClick} />
                </div>
              ))}
              {gems.length === 0 && (
                <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", gridColumn: "1/-1" }}>No hidden gems detected yet. Check back soon!</div>
              )}
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {!loading && !loadError && tab === "map" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24 }}>🗺️ Explore on Map</h2>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Places grouped by sector — click any card to see details.</p>
            </div>
            {/* Simulated map using CSS grid layout of sectors */}
            <div style={{ background: "#e8f4f8", borderRadius: 20, border: "2px solid #d1d5db", padding: 24, minHeight: 400, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.5 }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 16, letterSpacing: 1 }}>GREATER NOIDA — SECTOR MAP VIEW</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {places.map(p => {
                    const meta = categoryMeta[p.category] || categoryMeta.service;
                    return (
                      <div key={p._id} {...clickable(() => handlePlaceClick(p))}
                        style={{ background: "#fff", borderRadius: 12, padding: 12, cursor: "pointer", border: `2px solid ${meta.color}40`, transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 18 }}>{p.isHiddenGem ? "💎" : meta.emoji}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>{p.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{p.location.sector}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <StarDisplay rating={p.averageRating} size={10} />
                          <span style={{ fontSize: 11, fontWeight: 700 }}>{p.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 20, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
                  📍 Click any card to view full details & reviews
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
