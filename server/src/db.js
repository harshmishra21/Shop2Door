// Azure SQL connection with graceful fallback.
// If config is missing or the connection fails, pool stays null and the
// store layer serves built-in seed data instead. The API contract is
// identical in both modes.
const sql = require('mssql');

let pool = null;

const config = {
  user: process.env.AZURE_SQL_USER || '',
  password: process.env.AZURE_SQL_PASSWORD || '',
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE || 'shop2door',
  options: { encrypt: true, trustServerCertificate: false },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 8000,
  requestTimeout: 8000,
};

async function connect() {
  if (!config.user || !config.password || !config.server) {
    console.log('[db] No Azure SQL config — running in SEED mode (dummy data served from backend).');
    return null;
  }
  try {
    pool = await sql.connect(config);
    console.log('[db] Connected to Azure SQL.');
    return pool;
  } catch (err) {
    console.warn('[db] Azure SQL connection failed — falling back to SEED mode. Reason:', err.message);
    pool = null;
    return null;
  }
}

function isConnected() {
  return !!pool;
}

module.exports = { connect, isConnected, sql, get pool() { return pool; } };
