const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        placeId: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String, required: true, trim: true, maxlength: 30 },
        rating: { type: Number, required: true, min: 1, max: 5 },
        text: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
        sentimentScore: { type: Number, min: 0, max: 1, default: 0.5 },
        sentimentLabel: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
        themes: [String],
    },
    { timestamps: true }
);

reviewSchema.index({ placeId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
