const test = require("node:test");
const assert = require("node:assert/strict");
const { recencyWeight, recencyWeightedSentiment, applyReview, computeTrendScore, isHiddenGem } = require("../services/scoring");
const { heuristicSentiment } = require("../services/ai");

const NOW = Date.UTC(2026, 0, 31);
const daysAgo = (d) => new Date(NOW - d * 86400000);

test("recency weight halves every 14 days", () => {
    assert.equal(recencyWeight(daysAgo(0), NOW), 1);
    assert.ok(Math.abs(recencyWeight(daysAgo(14), NOW) - 0.5) < 1e-9);
});

test("recent reviews dominate weighted sentiment", () => {
    const s = recencyWeightedSentiment([
        { sentimentScore: 1, createdAt: daysAgo(0) },
        { sentimentScore: 0, createdAt: daysAgo(56) },
    ], NOW);
    assert.ok(s > 0.9);
    assert.equal(recencyWeightedSentiment([], NOW), null);
});

test("applyReview updates running averages", () => {
    const next = applyReview({ totalReviews: 3, averageRating: 4, sentimentScore: 0.8 }, { rating: 2, sentimentScore: 0.4 });
    assert.equal(next.totalReviews, 4);
    assert.equal(next.averageRating, 3.5);
    assert.ok(Math.abs(next.sentimentScore - 0.7) < 1e-9);
});

test("busy, well-loved places trend higher than quiet ones", () => {
    const busy = Array.from({ length: 5 }, () => ({ sentimentScore: 0.9, createdAt: daysAgo(1) }));
    const hot = computeTrendScore({ averageRating: 4.5, recentReviews: busy, now: NOW });
    const quiet = computeTrendScore({ averageRating: 4.5, sentimentScore: 0.9, recentReviews: [], now: NOW });
    assert.ok(hot > quiet);
    assert.ok(hot <= 1 && quiet >= 0);
});

test("hidden gem criteria", () => {
    const base = { sentimentScore: 0.9, totalReviews: 20, averageRating: 4.6, now: NOW };
    assert.equal(isHiddenGem(base), true);
    assert.equal(isHiddenGem({ ...base, totalReviews: 120 }), false);
    assert.equal(isHiddenGem({ ...base, averageRating: 4.0 }), false);
    assert.equal(isHiddenGem({ ...base, recentReviews: [{ sentimentScore: 0.3, createdAt: daysAgo(1) }] }), false);
});

test("heuristic sentiment handles punctuation and neutral text", () => {
    assert.equal(heuristicSentiment("Amazing food, great service!").label, "positive");
    assert.equal(heuristicSentiment("Terrible. Dirty and rude staff.").label, "negative");
    assert.equal(heuristicSentiment("It is a building on the corner").label, "neutral");
});
