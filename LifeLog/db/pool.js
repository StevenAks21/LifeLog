
const fs = require('fs')
const mysql = require('mysql2/promise')

const hasSock = fs.existsSync('/tmp/mysql.sock')

const pool = mysql.createPool({
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'rootpass',
  database: process.env.DB_NAME || 'lifelog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  socketPath: hasSock ? '/tmp/mysql.sock' : undefined,
  host: hasSock ? undefined : (process.env.DB_HOST || 'db'),
  port: hasSock ? undefined : Number(process.env.DB_PORT || 3306),
})

module.exports = { pool }