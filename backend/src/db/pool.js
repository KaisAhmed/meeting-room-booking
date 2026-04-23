const mysql = require('mysql2/promise')

let pool = null

function getPool() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'meeting_room_booking',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }

    pool = mysql.createPool(config)
  }
  return pool
}

module.exports = {
  getPool,
  sql: mysql
}

