const mongoose = require("mongoose");

const CATEGORIES = ["dhaba", "pg", "coaching", "transport", "service"];

const placeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        category: { type: String, enum: CATEGORIES, required: true },
        location: {
            address: { type: String, required: true },
            sector: { type: String, required: true },
            coordinates: { type: [Number], default: undefined }, // [lng, lat]
        },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        sentimentScore: { type: Number, default: 0.5, min: 0, max: 1 },
        totalReviews: { type: Number, default: 0 },
        trendScore: { type: Number, default: 0 },
        isHiddenGem: { type: Boolean, default: false },
        priceRange: { type: String, enum: ["budget", "mid", "premium"], default: "budget" },
        tags: [String],
        vibeSummary: { type: String, default: "" },
        images: [String],
        hours: { open: String, close: String },
    },
    { timestamps: true }
);

placeSchema.index({ name: "text", "location.sector": "text", tags: "text" });
placeSchema.index({ category: 1, trendScore: -1 });

module.exports = mongoose.model("Place", placeSchema);
module.exports.CATEGORIES = CATEGORIES;
