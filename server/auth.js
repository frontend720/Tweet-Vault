const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

// Keep Firebase Admin initialized for FCM push notifications
if (!admin.apps.length) {
  admin.initializeApp();
}

// Verifies Vault JWT sent as `Authorization: Bearer <token>`
// Attaches req.uid (= JWT sub) on success
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.type !== "access") throw new Error("Wrong token type");
    req.uid = decoded.sub;
    req.email = null;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { admin, requireAuth };
