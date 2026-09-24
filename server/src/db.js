// AWS RDS for SQL Server connection with a development-only seed fallback.
const sql = require('mssql');

let pool = null;
let mode = 'seed';

const config = {
  user: process.env.AWS_RDS_USER || process.env.DB_USER || '',
  password: process.env.AWS_RDS_PASSWORD || process.env.DB_PASSWORD || '',
  server: process.env.AWS_RDS_HOST || process.env.DB_HOST || '',
  database: process.env.AWS_RDS_DATABASE || process.env.DB_NAME || 'shop2door',
  port: Number(process.env.AWS_RDS_PORT || process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.AWS_RDS_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 8000,
  requestTimeout: 8000,
};

async function connect() {
  if (!config.user || !config.password || !config.server) {
    if (process.env.NODE_ENV === 'production' || process.env.DB_REQUIRED === 'true') {
      throw new Error('AWS RDS configuration is required in production.');
    }
    console.log('[db] No AWS RDS config — running in SEED mode (dummy data served from backend).');
    return null;
  }
  try {
    pool = await sql.connect(config);
    mode = 'rds';
    console.log('[db] Connected to AWS RDS for SQL Server.');
    return pool;
  } catch (err) {
    if (process.env.NODE_ENV === 'production' || process.env.DB_REQUIRED === 'true') {
      throw new Error(`AWS RDS connection failed: ${err.message}`);
    }
    console.warn('[db] AWS RDS connection failed — falling back to SEED mode. Reason:', err.message);
    pool = null;
    return null;
  }
}

function isConnected() {
  return !!pool;
}

function status() {
  return mode;
}

module.exports = { connect, isConnected, status, sql, get pool() { return pool; } };
