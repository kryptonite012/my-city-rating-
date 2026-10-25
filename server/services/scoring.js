// Pure scoring helpers: rating aggregates, recency-weighted sentiment,
// trend score and hidden-gem detection. No database access here so the
// formulas are easy to unit test.

const DAY_MS = 86400000;
const HALF_LIFE_DAYS = 14;
const VELOCITY_WINDOW_DAYS = 7;
const VELOCITY_TARGET = 5; // reviews per week that counts as "fully hot"

const clamp01 = (n) => Math.min(1, Math.max(0, n));

function ageInDays(date, now = Date.now()) {
    return Math.max(0, (now - new Date(date).getTime()) / DAY_MS);
}

// Exponential decay: a review loses half its weight every HALF_LIFE_DAYS.
function recencyWeight(date, now = Date.now()) {
    return Math.pow(0.5, ageInDays(date, now) / HALF_LIFE_DAYS);
}

function recencyWeightedSentiment(reviews, now = Date.now()) {
    let weighted = 0;
    let total = 0;
    for (const r of reviews) {
        const w = recencyWeight(r.createdAt, now);
        weighted += w * r.sentimentScore;
        total += w;
    }
    return total === 0 ? null : weighted / total;
}

// Folds one new review into a place's running aggregates.
function applyReview(stats, review) {
    const n = stats.totalReviews || 0;
    const totalReviews = n + 1;
    return {
        totalReviews,
        averageRating: ((stats.averageRating || 0) * n + review.rating) / totalReviews,
        sentimentScore: ((stats.sentimentScore ?? 0.5) * n + review.sentimentScore) / totalReviews,
    };
}

// trendScore = 0.4 * recent sentiment + 0.3 * review velocity + 0.3 * rating
function computeTrendScore({ averageRating, sentimentScore, recentReviews = [], now = Date.now() }) {
    const recentSentiment = recencyWeightedSentiment(recentReviews, now) ?? sentimentScore ?? 0.5;
    const weekly = recentReviews.filter((r) => ageInDays(r.createdAt, now) <= VELOCITY_WINDOW_DAYS).length;
    const velocity = clamp01(weekly / VELOCITY_TARGET);
    const rating = clamp01((averageRating || 0) / 5);
    return clamp01(0.4 * recentSentiment + 0.3 * velocity + 0.3 * rating);
}

// Hidden gem: loved by the few who found it, and not cooling off.
// Sentiment >= 0.85, fewer than 75 reviews, rating >= 4.2, recent sentiment not below overall.
function isHiddenGem({ sentimentScore, totalReviews, averageRating, recentReviews = [], now = Date.now() }) {
    const recent = recencyWeightedSentiment(recentReviews, now);
    const trendingUp = recent === null || recent >= sentimentScore - 0.02;
    return sentimentScore >= 0.85 && totalReviews < 75 && averageRating >= 4.2 && trendingUp;
}

module.exports = {
    recencyWeight,
    recencyWeightedSentiment,
    applyReview,
    computeTrendScore,
    isHiddenGem,
};
