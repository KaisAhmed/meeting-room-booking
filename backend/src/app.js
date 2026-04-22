const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MSSQLStore = require('connect-mssql-v2')

const { requireAuth } = require('./middleware/auth')
const { parseConnectionStringToConfig } = require('./db/pool')

const authRoutes = require('./routes/auth')
const bookingRoutes = require('./routes/bookings')
const adminRoutes = require('./routes/admin')
const dashboardRoutes = require('./routes/dashboard')
const bookingTypesRoutes = require('./routes/bookingTypes')

function createApp() {
  const app = express()

  app.use(helmet())
  app.use(morgan('dev'))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    }),
  )

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // for local dev
      },
      store: new MSSQLStore(
        parseConnectionStringToConfig(process.env.SQL_CONNECTION_STRING),
        {
          table: '[dbo].[sessions]',
          ttl: 24 * 60 * 60 * 1000,
          useUTC: false,
        },
      ),
    }),
  )

  // Routes
  app.use('/api/auth', authRoutes)
  app.use('/api/booking-types', bookingTypesRoutes)
  app.use('/api/bookings', bookingRoutes)
  app.use('/api/dashboard', requireAuth, dashboardRoutes)
  app.use('/api/admin', adminRoutes)

  // Health
  app.get('/api/health', (req, res) => res.json({ ok: true }))

  // 404
  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' })
  })

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err)
    const statusCode = err.statusCode || 500
    res.status(statusCode).json({ message: err.message || 'Server error' })
  })

  return app
}

module.exports = { createApp }

