const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'Diigo-Attendance',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '12345678',
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
});

module.exports = pool;
