const express = require('express');
const store = require('../store');
const { authRequired } = require('../auth');

const router = express.Router();
const asyncH = (fn) => (req, res) => fn(req, res).catch((e) => {
  const status = (typeof e.code === 'number' && e.code >= 100 && e.code < 600) ? e.code : 500;
  res.status(status).json({ error: e.message || 'Something went wrong.' });
});
const onlyPartner = authRequired(['partner']);

async function pid(req, res) {
  const id = await store.providerIdFor(req.auth.userId);
  if (!id) { res.status(404).json({ error: 'No business profile linked to this account yet.' }); return null; }
  return id;
}

router.get('/dashboard', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.getDashboard(id));
}));

router.get('/requests', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.listRequests(id, req.query.tab || 'new'));
}));

router.get('/jobs/:id', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  const j = await store.getJob(req.params.id, id);
  if (!j) return res.status(404).json({ error: 'Job not found.' });
  res.json(j);
}));

router.post('/jobs/:id/accept', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.setJobStatus(req.params.id, id, 'upcoming'));
}));

router.post('/jobs/:id/decline', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.setJobStatus(req.params.id, id, 'declined'));
}));

router.post('/jobs/:id/status', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.setJobStatus(req.params.id, id, (req.body || {}).status));
}));

router.get('/services', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.listServices(id));
}));

router.post('/services', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.status(201).json(await store.addService(id, req.body || {}));
}));

router.patch('/services/:id', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.updateService(id, req.params.id, req.body || {}));
}));

router.delete('/services/:id', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.removeService(id, req.params.id));
}));

router.get('/availability', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.getAvailability(id));
}));

router.patch('/availability', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.updateAvailability(id, req.body || {}));
}));

router.get('/earnings', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.getEarnings(id));
}));

router.get('/profile', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.getProvider(id));
}));

router.patch('/profile', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.updateProfile(id, req.body || {}));
}));

router.get('/counts', onlyPartner, asyncH(async (req, res) => {
  const id = await pid(req, res); if (!id) return;
  res.json(await store.partnerCounts(id));
}));

module.exports = router;
