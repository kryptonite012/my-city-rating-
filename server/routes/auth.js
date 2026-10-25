const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const signToken = (user) =>
    jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (user) => ({ id: user._id, username: user.username, email: user.email, college: user.college });

router.post("/register", async (req, res, next) => {
    try {
        const { username, email, password, college } = req.body;
        if (!/^[\w.-]{3,30}$/.test(username || "")) return res.status(400).json({ msg: "Username must be 3-30 letters, numbers, _ . or -" });
        if (!/^\S+@\S+\.\S+$/.test(email || "")) return res.status(400).json({ msg: "Valid email required" });
        if (!password || password.length < 8) return res.status(400).json({ msg: "Password must be at least 8 characters" });

        const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
        if (exists) return res.status(409).json({ msg: "Username or email already registered" });

        const user = await User.create({ username, email, college, passwordHash: await bcrypt.hash(password, 12) });
        res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (err) {
        next(err);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: String(email || "").toLowerCase() }).select("+passwordHash");
        if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
            return res.status(401).json({ msg: "Invalid email or password" });
        }
        res.json({ token: signToken(user), user: publicUser(user) });
    } catch (err) {
        next(err);
    }
});

router.get("/me", requireAuth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.json(publicUser(user));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
