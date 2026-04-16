const jwt = require("jsonwebtoken");
const { decodeJwt, createRemoteJWKSet, jwtVerify } = require("jose");

const jwksCache = new Map();

async function verifyClerkToken(token) {
  const decoded = decodeJwt(token);
  if (!decoded?.iss) throw new Error("Invalid Clerk issuer");

  if (!jwksCache.has(decoded.iss)) {
    jwksCache.set(decoded.iss, createRemoteJWKSet(new URL(`${decoded.iss}/.well-known/jwks.json`)));
  }

  const JWKS = jwksCache.get(decoded.iss);
  const { payload } = await jwtVerify(token, JWKS, { issuer: decoded.iss });

  return {
    provider: "clerk",
    role: "restaurant",
    clerkUserId: payload.sub,
    email: payload.email || payload.email_address || "",
    sessionClaims: payload,
    isPlatformAdmin: false
  };
}

async function authenticateRequest(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) {
    req.auth = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = {
      provider: "local",
      role: payload.role,
      isPlatformAdmin: payload.role === "admin"
    };
    return next();
  } catch (err) {
    try {
      req.auth = await verifyClerkToken(token);
      return next();
    } catch (clerkErr) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
}

function requireDashboardUser(req, res, next) {
  if (!req.auth) return res.status(401).json({ message: "Missing token" });
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.auth) return res.status(401).json({ message: "Missing token" });
  if (!req.auth.isPlatformAdmin) return res.status(403).json({ message: "Forbidden" });
  return next();
}

function canAccessRestaurant(req, restaurant) {
  if (!req.auth || !restaurant) return false;
  if (req.auth.isPlatformAdmin) return true;
  return Boolean(req.auth.clerkUserId && restaurant.ownerClerkUserId === req.auth.clerkUserId);
}

module.exports = {
  authenticateRequest,
  canAccessRestaurant,
  requireAdmin,
  requireDashboardUser
};
