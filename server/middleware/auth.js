const jwt = require("jsonwebtoken");

// Accepts both "Bearer <token>" and a bare token in the Authorization header.
function readToken(req) {
    const header = req.header("Authorization");
    if (!header) return null;
    return header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();
}

function requireAuth(req, res, next) {
    const token = readToken(req);
    if (!token) return res.status(401).json({ msg: "No token" });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ msg: "Invalid token" });
    }
}

// Attaches req.user when a valid token is present, but never blocks the request.
function optionalAuth(req, res, next) {
    const token = readToken(req);
    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            // ignore: treated as an anonymous request
        }
    }
    next();
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.optionalAuth = optionalAuth;
