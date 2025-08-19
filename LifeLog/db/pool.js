const mysql = require('mysql2/promise');
require('dotenv').config();

const cfg = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z'
};

// Prefer UNIX socket if provided (handy for local macOS/Homebrew)
if (process.env.DB_SOCKET && process.env.DB_SOCKET.trim()) {
  cfg.socketPath = process.env.DB_SOCKET.trim();
  console.log(`[db] using socket ${cfg.socketPath}`);
} else {
  cfg.host = process.env.DB_HOST || '127.0.0.1';
  cfg.port = Number(process.env.DB_PORT || 3306);
  console.log(`[db] using TCP ${cfg.host}:${cfg.port}`);
}

const pool = mysql.createPool(cfg);
module.exports = { pool };