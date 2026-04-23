const bcrypt = require('bcrypt')

async function ensureInitialData(pool) {
  // Ensure sessions table has correct schema for express-mysql-session
  try {
    const [sidColumnRows] = await pool.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'sessions'
      AND COLUMN_NAME = 'session_id'
    `)

    if (sidColumnRows.length === 0) {
      // Table exists but doesn't have 'session_id' column, drop and recreate
      await pool.execute('DROP TABLE sessions')

      await pool.execute(`
        CREATE TABLE sessions (
          session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
          expires INT(11) UNSIGNED NOT NULL,
          data MEDIUMTEXT COLLATE utf8mb4_bin,
          PRIMARY KEY (session_id)
        ) COLLATE utf8mb4_bin
      `)
      console.log('Recreated sessions table with correct schema')
    }
  } catch (err) {
    // Table doesn't exist, create it
    try {
      await pool.execute(`
        CREATE TABLE sessions (
          session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
          expires INT(11) UNSIGNED NOT NULL,
          data MEDIUMTEXT COLLATE utf8mb4_bin,
          PRIMARY KEY (session_id)
        ) COLLATE utf8mb4_bin
      `)
      console.log('Created sessions table')
    } catch (createErr) {
      console.error('Failed to create sessions table:', createErr.message)
    }
  }

  const username = process.env.INIT_ADMIN_USERNAME
  const password = process.env.INIT_ADMIN_PASSWORD

  if (!username || !password) return

  const [existsRows] = await pool.execute(`
    SELECT id FROM users WHERE username = ? LIMIT 1
  `, [username.trim()])

  if (existsRows.length > 0) return

  const passwordHash = await bcrypt.hash(password, 10)

  await pool.execute(`
    INSERT INTO users (username, password_hash, role)
    VALUES (?, ?, 'admin')
  `, [username.trim(), passwordHash])
}

module.exports = { ensureInitialData }

