const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const { getPool } = require('./db/pool')
const { ensureInitialData } = require('./db/seed')
const { createApp } = require('./app')

async function main() {
  const app = createApp()

  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`MeetingBooking API listening on port ${port}`)
    console.log('SQL_CONNECTION_STRING:', process.env.SQL_CONNECTION_STRING ? 'SET' : 'EMPTY')
  })

  // DB init is best-effort:
  // - keep server up for health/debugging even if SQL env is missing
  // - routes will still fail until SQL_CONNECTION_STRING is correct
  try {
    const pool = await getPool()
    await ensureInitialData(pool)
    console.log('DB init/seed completed')
  } catch (err) {
    console.error('DB init failed (endpoints may fail):', err.message || err)
  }
}

main().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})

