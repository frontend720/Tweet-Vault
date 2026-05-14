const admin = require("firebase-admin");

// Initialize once — safe to call multiple times (firebase-admin is a singleton)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Verifies Firebase ID token sent as `Authorization: Bearer <token>`
// Attaches req.uid and req.email on success
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  const token = header.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email ?? null;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { admin, requireAuth };
