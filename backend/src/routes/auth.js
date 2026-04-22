const express = require('express')
const bcrypt = require('bcrypt')
const { getUserByUsername } = require('../db/queries')
const { requireAuth } = require('../middleware/auth')

function validateLoginBody(body) {
  if (!body) return 'Missing body'
  if (!body.username || typeof body.username !== 'string') return 'username is required'
  if (!body.password || typeof body.password !== 'string') return 'password is required'
  return null
}

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const err = validateLoginBody(req.body)
    if (err) return res.status(400).json({ message: err })

    const username = req.body.username.trim()
    const password = req.body.password

    const user = await getUserByUsername(username)
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    // Cookie-session: store only minimal data.
    req.session.user = { id: user.id, username: user.username, role: user.role }
    return res.json({ user: req.session.user })
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Login failed' })
  }
})

router.post('/logout', requireAuth, async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user })
})

module.exports = router

