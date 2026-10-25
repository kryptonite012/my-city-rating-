const express = require("express");
const mongoose = require("mongoose");
const Place = require("../models/Place");
const Review = require("../models/Review");
const User = require("../models/User");
const { optionalAuth } = require("../middleware/auth");
const { analyzeSentiment, generateVibeSummary } = require("../services/ai");
const { applyReview, computeTrendScore, isHiddenGem } = require("../services/scoring");

const router = express.Router();
const RECENT_WINDOW_MS = 30 * 86400000;

const SORTS = {
    trending: { trendScore: -1 },
    rating: { averageRating: -1 },
    reviews: { totalReviews: -1 },
    newest: { createdAt: -1 },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Validates :id once for every route below.
router.param("id", (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ msg: "Invalid place id" });
    next();
});

// GET /api/places?category=pg&q=alpha&sort=rating
router.get("/", async (req, res, next) => {
    try {
        const { category, q, sort = "trending" } = req.query;
        const filter = {};
        if (category && category !== "all") filter.category = String(category);
        if (q) {
            const rx = new RegExp(escapeRegex(String(q).slice(0, 50)), "i");
            filter.$or = [{ name: rx }, { "location.sector": rx }, { tags: rx }];
        }
        const places = await Place.find(filter).sort(SORTS[sort] || SORTS.trending).limit(100);
        res.json(places);
    } catch (err) {
        next(err);
    }
});

router.get("/trending", async (req, res, next) => {
    try {
        res.json(await Place.find().sort(SORTS.trending).limit(20));
    } catch (err) {
        next(err);
    }
});

router.get("/hidden-gems", async (req, res, next) => {
    try {
        res.json(await Place.find({ isHiddenGem: true }).sort(SORTS.trending));
    } catch (err) {
        next(err);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) return res.status(404).json({ msg: "Place not found" });
        res.json(place);
    } catch (err) {
        next(err);
    }
});

router.get("/:id/reviews", async (req, res, next) => {
    try {
        const reviews = await Review.find({ placeId: req.params.id }).sort({ createdAt: -1 }).limit(100);
        res.json(reviews);
    } catch (err) {
        next(err);
    }
});

async function refreshPlaceVibe(place) {
    const reviews = await Review.find({ placeId: place._id }).sort({ createdAt: -1 }).limit(20);
    place.vibeSummary = await generateVibeSummary(place, reviews);
    await place.save();
    return place;
}

// POST /api/places/:id/reviews  { rating, text, username? }
router.post("/:id/reviews", optionalAuth, async (req, res, next) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) return res.status(404).json({ msg: "Place not found" });

        const rating = Number(req.body.rating);
        const text = String(req.body.text || "").trim();
        let username = String(req.body.username || "").trim();
        if (req.user) {
            const user = await User.findById(req.user.id);
            if (user) username = user.username;
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ msg: "Rating must be 1-5" });
        if (text.length < 20 || text.length > 2000) return res.status(400).json({ msg: "Review must be 20-2000 characters" });
        if (!/^[\w.-]{2,30}$/.test(username)) return res.status(400).json({ msg: "Handle must be 2-30 letters, numbers, _ . or -" });

        const sentiment = await analyzeSentiment(text);
        const review = await Review.create({
            placeId: place._id,
            userId: req.user?.id,
            username,
            rating,
            text,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label,
            themes: sentiment.themes,
        });

        const now = Date.now();
        const recentReviews = await Review.find({ placeId: place._id, createdAt: { $gte: new Date(now - RECENT_WINDOW_MS) } });
        Object.assign(place, applyReview(place, review));
        place.trendScore = computeTrendScore({ ...place.toObject(), recentReviews, now });
        place.isHiddenGem = isHiddenGem({ ...place.toObject(), recentReviews, now });
        await place.save();

        res.status(201).json({ review, place });

        // Regenerate the vibe summary in the background so the response stays fast.
        refreshPlaceVibe(place).catch((err) => console.warn("Vibe refresh failed:", err.message));
    } catch (err) {
        next(err);
    }
});

// POST /api/places/:id/vibe — regenerate the AI vibe summary on demand
router.post("/:id/vibe", async (req, res, next) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) return res.status(404).json({ msg: "Place not found" });
        const updated = await refreshPlaceVibe(place);
        res.json({ vibeSummary: updated.vibeSummary });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
