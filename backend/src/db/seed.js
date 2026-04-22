const bcrypt = require('bcrypt')
const { sql } = require('./pool')

async function ensureInitialData(pool) {
  // Ensure sessions table has correct schema for connect-mssql-v2
  try {
    const sidColumnResult = await pool
      .request()
      .query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'sessions' AND COLUMN_NAME = 'sid'")
    
    if (sidColumnResult.recordset.length === 0) {
      // Table exists but doesn't have 'sid' column, drop and recreate
      await pool.request().query('DROP TABLE dbo.sessions')
      
      await pool.request().query(`
        CREATE TABLE dbo.sessions (
          sid NVARCHAR(255) NOT NULL PRIMARY KEY,
          expires DATETIME2 NOT NULL,
          session NVARCHAR(MAX) NOT NULL
        )
      `)
      console.log('Recreated sessions table with correct schema')
    }
  } catch (err) {
    // Table doesn't exist, create it
    try {
      await pool.request().query(`
        CREATE TABLE dbo.sessions (
          sid NVARCHAR(255) NOT NULL PRIMARY KEY,
          expires DATETIME2 NOT NULL,
          session NVARCHAR(MAX) NOT NULL
        )
      `)
      console.log('Created sessions table')
    } catch (createErr) {
      console.error('Failed to create sessions table:', createErr.message)
    }
  }

  const username = process.env.INIT_ADMIN_USERNAME
  const password = process.env.INIT_ADMIN_PASSWORD

  if (!username || !password) return

  const existsResult = await pool
    .request()
    .input('username', sql.NVarChar(50), username.trim())
    .query('SELECT TOP 1 id FROM users WHERE username=@username')

  if (existsResult.recordset.length > 0) return

  const passwordHash = await bcrypt.hash(password, 10)

  await pool
    .request()
    .input('username', sql.NVarChar(50), username.trim())
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .input('role', sql.NVarChar(20), 'admin')
    .query(`
      INSERT INTO users (username, password_hash, role)
      VALUES (@username, @passwordHash, @role)
    `)
}

module.exports = { ensureInitialData }

