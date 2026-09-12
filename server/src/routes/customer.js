const express = require('express');
const store = require('../store');
const { authRequired } = require('../auth');

const router = express.Router();
const asyncH = (fn) => (req, res) => fn(req, res).catch((e) => res.status(e.code || 500).json({ error: e.message || 'Something went wrong.' }));
const me = authRequired(['user']);

router.get('/categories', asyncH(async (req, res) => res.json(await store.listCategories())));

router.get('/providers', asyncH(async (req, res) => {
  res.json(await store.searchProviders({
    q: req.query.q || '', maxDistance: Number(req.query.maxDistance) || 0,
    maxPrice: Number(req.query.maxPrice) || 0, minRating: Number(req.query.minRating) || 0,
    availableToday: req.query.availableToday === '1',
  }));
}));

router.get('/providers/:id', asyncH(async (req, res) => {
  const p = await store.getProvider(req.params.id);
  if (!p) return res.status(404).json({ error: 'Provider not found.' });
  res.json(p);
}));

router.get('/recommendations', me, asyncH(async (req, res) => res.json(await store.listRecommendations())));

router.get('/bookings', me, asyncH(async (req, res) => res.json(await store.listBookings(req.auth.userId, req.query.tab || 'upcoming'))));

router.post('/bookings', me, asyncH(async (req, res) => {
  res.status(201).json(await store.createBooking(req.auth.userId, req.body || {}));
}));

router.get('/bookings/:id', me, asyncH(async (req, res) => {
  const b = await store.getBooking(req.params.id, req.auth.userId);
  if (!b) return res.status(404).json({ error: 'Booking not found.' });
  res.json(b);
}));

router.post('/bookings/:id/cancel', me, asyncH(async (req, res) => res.json(await store.cancelBooking(req.params.id, req.auth.userId))));

router.get('/wallet', me, asyncH(async (req, res) => res.json(await store.getWallet(req.auth.userId))));

router.post('/wallet/topup', me, asyncH(async (req, res) => res.json(await store.topupWallet(req.auth.userId, (req.body || {}).amount))));

router.get('/loyalty', me, asyncH(async (req, res) => res.json(await store.getLoyalty(req.auth.userId))));

router.post('/loyalty/redeem', me, asyncH(async (req, res) => res.json(await store.redeemReward(req.auth.userId))));

router.post('/reviews', me, asyncH(async (req, res) => res.status(201).json(await store.submitReview(req.auth.userId, req.body || {}))));

router.get('/tickets', me, asyncH(async (req, res) => res.json(await store.listTickets(req.auth.userId))));

router.post('/tickets', me, asyncH(async (req, res) => res.status(201).json(await store.createTicket(req.auth.userId, req.body || {}))));

router.get('/counts', me, asyncH(async (req, res) => res.json(await store.customerCounts(req.auth.userId))));

module.exports = router;
