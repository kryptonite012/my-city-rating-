const express = require("express");
const { analyzeSentiment, isEnabled } = require("../services/ai");

const router = express.Router();

router.get("/status", (req, res) => res.json({ claude: isEnabled() }));

// POST /api/ai/sentiment { text } — live preview while a review is being written
router.post("/sentiment", async (req, res, next) => {
    try {
        const text = String(req.body.text || "").trim();
        if (text.length < 15 || text.length > 2000) return res.status(400).json({ msg: "Text must be 15-2000 characters" });
        res.json(await analyzeSentiment(text));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
