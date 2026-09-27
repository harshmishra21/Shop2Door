const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const db = require('./db');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', apiLimiter);

// Allow the optional Live Server workflow on localhost:5500 to use this API.
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/,
    /^https:\/\/shop2door\.onrender\.com$/,
  ];
  if (allowedOrigins.some((re) => re.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: db.status(), time: new Date().toISOString() });
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

const PORT = Number(process.env.PORT) || 3001;

// Start the server, automatically rolling to the next free port if the
// requested one is already in use (e.g. another dev server on :3000),
// instead of crashing with EADDRINUSE.
function listen(port, attemptsLeft = 10) {
  const server = app.listen(port, () => {
    if (port !== PORT) console.log(`[server] Port ${PORT} was busy — using ${port} instead.`);
    console.log(`[server] Shop2Door backend on http://localhost:${port} (db: ${db.status()})`);
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
db.connect().then(() => listen(PORT)).catch((err) => {
  console.error('[server] Database startup failed:', err.message);
  process.exit(1);
});
