const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));

const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false });

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", writeLimiter, require("./routes/auth"));
app.use("/api/ai", aiLimiter, require("./routes/ai"));
app.post("/api/places/:id/reviews", writeLimiter);
app.post("/api/places/:id/vibe", aiLimiter);
app.use("/api/places", require("./routes/places"));

app.use((req, res) => res.status(404).json({ msg: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err);
    if (err.name === "ValidationError") return res.status(400).json({ msg: err.message });
    res.status(500).json({ msg: "Something went wrong" });
});

module.exports = app;
