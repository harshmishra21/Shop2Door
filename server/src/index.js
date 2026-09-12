const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: db.isConnected() ? 'azure' : 'seed', time: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/customer'));
app.use('/api/partner', require('./routes/partner'));
app.use('/api/admin', require('./routes/admin'));

// Serve the frontend (project root) so the app works from one origin.
const webRoot = path.join(__dirname, '..', '..');
app.use(express.static(webRoot));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(webRoot, 'index.html'));
});

const PORT = Number(process.env.PORT) || 3000;

// Start the server, automatically rolling to the next free port if the
// requested one is already in use (e.g. another dev server on :3000),
// instead of crashing with EADDRINUSE.
function listen(port, attemptsLeft = 10) {
  const server = app.listen(port, () => {
    if (port !== PORT) console.log(`[server] Port ${PORT} was busy — using ${port} instead.`);
    console.log(`[server] Shop2Door backend on http://localhost:${port} (db: ${db.isConnected() ? 'azure' : 'seed'})`);
  });
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`[server] Port ${port} is already in use — trying ${port + 1}...`);
      listen(port + 1, attemptsLeft - 1);
    } else {
      console.error('[server] Failed to start:', err && err.message ? err.message : err);
      process.exit(1);
    }
  });
}
db.connect().then(() => listen(PORT));
