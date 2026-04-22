const sql = require('mssql')

let poolPromise = null

function parseConnectionStringToConfig(connectionString) {
  // Basic parser for semicolon-separated key/value pairs.
  // Example: Server=.;Database=MyDb;Trusted_Connection=true;TrustServerCertificate=true;
  const tokens = (connectionString || '')
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean)

  const map = new Map()
  for (const token of tokens) {
    const idx = token.indexOf('=')
    if (idx === -1) continue
    const key = token.slice(0, idx).trim().toLowerCase()
    const value = token.slice(idx + 1).trim()
    map.set(key, value)
  }

  const server = map.get('server') || map.get('data source') || map.get('addr') || map.get('address')
  const port = map.get('port')
  const database = map.get('database') || map.get('initial catalog')
  const user = map.get('user id') || map.get('user') || map.get('uid') || map.get('username')
  const password = map.get('password') || map.get('pwd')

  const trustedConnectionRaw = map.get('trusted_connection') || map.get('trusted connection')
  const trustedConnection = trustedConnectionRaw
    ? trustedConnectionRaw.toLowerCase() === 'true'
    : false

  const trustServerCertificateRaw =
    map.get('trustservercertificate') || map.get('trust_server_certificate')
  const trustServerCertificate = trustServerCertificateRaw
    ? trustServerCertificateRaw.toLowerCase() === 'true'
    : true

  const encryptRaw = map.get('encrypt')
  const encrypt = encryptRaw ? encryptRaw.toLowerCase() === 'true' : false

  if (!server || typeof server !== 'string') {
    const e = new Error('Could not parse SQL server from SQL_CONNECTION_STRING')
    e.statusCode = 500
    throw e
  }

  return {
    server,
    port: port ? parseInt(port, 10) : undefined,
    database: database || undefined,
    user: trustedConnection ? undefined : user,
    password: trustedConnection ? undefined : password,
    options: {
      encrypt,
      trustServerCertificate,
      trustedConnection,
    },
  }
}

async function getPool() {
  if (poolPromise) return poolPromise

  if (!process.env.SQL_CONNECTION_STRING) {
    throw new Error('Missing SQL_CONNECTION_STRING in environment')
  }

  const raw = process.env.SQL_CONNECTION_STRING

  // Parse the connection string to config since connectionString option can be unreliable
  const cfg = parseConnectionStringToConfig(raw)
  poolPromise = sql.connect(cfg)

  return poolPromise
}

module.exports = { getPool, sql, parseConnectionStringToConfig }

