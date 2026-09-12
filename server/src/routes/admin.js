const express = require('express');
const store = require('../store');
const { authRequired } = require('../auth');

const router = express.Router();
const asyncH = (fn) => (req, res) => fn(req, res).catch((e) => res.status(e.code || 500).json({ error: e.message || 'Something went wrong.' }));
const onlyAdmin = authRequired(['admin']);

router.get('/overview', onlyAdmin, asyncH(async (req, res) => res.json(await store.getOverview())));
router.get('/customers', onlyAdmin, asyncH(async (req, res) => res.json(await store.listCustomers())));
router.get('/providers', onlyAdmin, asyncH(async (req, res) => res.json(await store.listProviders())));
router.get('/bookings', onlyAdmin, asyncH(async (req, res) => res.json(await store.listBookingsAdmin())));
router.get('/wallet', onlyAdmin, asyncH(async (req, res) => res.json(await store.listWalletAdmin())));
router.get('/audit', onlyAdmin, asyncH(async (req, res) => res.json(await store.listAudit())));
router.get('/loyalty', onlyAdmin, asyncH(async (req, res) => res.json(await store.getLoyaltyAdmin())));
router.get('/insights', onlyAdmin, asyncH(async (req, res) => res.json(await store.listInsights())));
router.get('/exports', onlyAdmin, asyncH(async (req, res) => res.json(await store.listExports())));

router.post('/exports', onlyAdmin, asyncH(async (req, res) => {
  const u = await store.findUserById(req.auth.userId);
  res.status(201).json(await store.createExport({ ...(req.body || {}), by: u ? u.name : 'Admin' }));
}));

router.get('/queries', onlyAdmin, asyncH(async (req, res) => res.json(await store.listTicketsAdmin())));

router.post('/queries/:id/reply', onlyAdmin, asyncH(async (req, res) => {
  const u = await store.findUserById(req.auth.userId);
  res.json(await store.replyTicket(req.params.id, { from: 'agent', text: (req.body || {}).text, by: u ? u.name : 'Support' }));
}));

router.get('/complaints', onlyAdmin, asyncH(async (req, res) => res.json(await store.listComplaints())));

router.patch('/complaints/:id', onlyAdmin, asyncH(async (req, res) => {
  res.json(await store.updateComplaint(req.params.id, req.body || {}, req.auth));
}));

router.get('/counts', onlyAdmin, asyncH(async (req, res) => res.json(await store.adminCounts())));

module.exports = router;
