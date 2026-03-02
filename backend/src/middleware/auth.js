const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { requireAdmin };