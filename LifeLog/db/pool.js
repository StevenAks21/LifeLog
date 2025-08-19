const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    user: 'root',
    password: 'rootpass',
    database: 'appdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z',
    socketPath: require('fs').existsSync('/tmp/mysql.sock')
        ? '/tmp/mysql.sock'
        : undefined,
    host: require('fs').existsSync('/tmp/mysql.sock') ? undefined : 'db',
    port: require('fs').existsSync('/tmp/mysql.sock') ? undefined : 3306,
});

module.exports = { pool };