// Auth primitives: password hashing (SHA-256 + per-user salt, no extra deps)
// and opaque bearer tokens kept in an in-memory session map.
const crypto = require('crypto');

function newSalt() {
  return crypto.randomBytes(8).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(String(salt) + String(password)).digest('hex');
}

function verifyPassword(password, salt, expected) {
  if (!salt || !expected) return false;
  return hashPassword(password, salt) === expected;
}

const sessions = new Map(); // token -> { userId, role, createdAt }

function createSession(user) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { userId: user.id, role: user.role, createdAt: Date.now() });
  return token;
}

function getSession(token) {
  return (token && sessions.get(token)) || null;
}

function destroySession(token) {
  if (token) sessions.delete(token);
}

function bearerToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// roles: [] = any authenticated user
function authRequired(roles = []) {
  return (req, res, next) => {
    const s = getSession(bearerToken(req));
    if (!s) return res.status(401).json({ error: 'Unauthorized — please sign in again.' });
    if (roles.length && !roles.includes(s.role)) return res.status(403).json({ error: 'Forbidden for this role.' });
    req.auth = s;
    next();
  };
}

module.exports = { newSalt, hashPassword, verifyPassword, createSession, getSession, destroySession, bearerToken, authRequired };
