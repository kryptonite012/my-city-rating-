const jwt = require("jsonwebtoken");

// Verifies a JWT sent as "Authorization: Bearer <token>" (a bare token is also accepted).
module.exports = function auth(req, res, next) {
    const header = req.header("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();

    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ msg: "Server auth is not configured" });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ msg: "Invalid or expired token" });
    }
};
