const express = require('express');
const store = require('../store');
const { createSession, destroySession, bearerToken, verifyPassword, authRequired } = require('../auth');

const router = express.Router();
const asyncH = (fn) => (req, res) => fn(req, res).catch((e) => res.status(e.code || 500).json({ error: e.message || 'Something went wrong.' }));

router.post('/login', asyncH(async (req, res) => {
  const { email, password } = req.body || {};
  const u = await store.findUserByEmail(email || '');
  if (!u || !verifyPassword(password || '', u.salt, u.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password. Try one of the demo accounts.' });
  }
  const token = createSession(u);
  res.json({ token, user: store.publicUser(u) });
}));

router.post('/register', asyncH(async (req, res) => {
  const { name, email, mobile, password, role, businessName } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Full name is required.' });
  if (!/^\S+@\S+\.\S+$/.test(String(email || '').trim())) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (String(mobile || '').replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Enter a valid mobile number.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (!['user', 'partner'].includes(role)) return res.status(400).json({ error: 'Choose a User or Partner account.' });
  if (role === 'partner' && !(businessName || '').trim()) return res.status(400).json({ error: 'Business name is required for partners.' });
  const u = await store.createUser({ name, email, mobile, password, role, businessName });
  const token = createSession(u);
  res.status(201).json({ token, user: store.publicUser(u) });
}));

router.get('/me', authRequired(), asyncH(async (req, res) => {
  const u = await store.findUserById(req.auth.userId);
  if (!u) return res.status(401).json({ error: 'Session expired.' });
  res.json({ user: store.publicUser(u) });
}));

router.post('/logout', (req, res) => {
  destroySession(bearerToken(req));
  res.json({ ok: true });
});

module.exports = router;
