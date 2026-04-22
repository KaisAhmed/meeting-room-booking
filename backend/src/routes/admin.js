const express = require('express')
const bcrypt = require('bcrypt')
const { requireAuth } = require('../middleware/auth')
const { requireAdmin } = require('./../middleware/admin')
const { getAdminRequests, decideBooking, getUsers, createUser, updateUser, deleteUser } = require('../db/queries')

const router = express.Router()

router.get('/requests', requireAuth, requireAdmin, async (req, res) => {
  try {
    const roomId = Number(process.env.ROOM_ID || 1)
    const requests = await getAdminRequests({ roomId })
    res.json({ requests })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load admin requests' })
  }
})

router.post('/requests/:id/decision', requireAuth, requireAdmin, async (req, res) => {
  try {
    const bookingId = Number(req.params.id)
    if (!bookingId) return res.status(400).json({ message: 'Invalid booking id' })

    const decisionRaw = (req.body.decision || '').toString()
    let decision
    if (decisionRaw === 'approve') decision = 'approved'
    else if (decisionRaw === 'reject') decision = 'rejected'
    else if (decisionRaw === 'approved') decision = 'approved'
    else if (decisionRaw === 'rejected') decision = 'rejected'
    else return res.status(400).json({ message: 'decision must be approve|reject' })

    const rejectReason = req.body.rejectReason || ''
    if (decision === 'rejected' && !rejectReason.trim()) {
      return res.status(400).json({ message: 'rejectReason is required when rejecting' })
    }

    const updated = await decideBooking({ bookingId, decision, rejectReason })
    res.json({ booking: updated })
  } catch (e) {
    const statusCode = e.statusCode || 500
    res.status(statusCode).json({ message: e.message || 'Decision failed' })
  }
})

router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await getUsers()
    res.json({ users })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load users' })
  }
})

router.post('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const username = (req.body.username || '').toString().trim()
    const password = (req.body.password || '').toString()
    const role = (req.body.role || 'user').toString().trim().toLowerCase()

    if (!username) return res.status(400).json({ message: 'Username is required' })
    if (!password) return res.status(400).json({ message: 'Password is required' })
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ message: 'Invalid role' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser({ username, passwordHash, role })
    res.status(201).json({ user })
  } catch (e) {
    if (e.message && e.message.includes('unique')) {
      return res.status(409).json({ message: 'Username already exists' })
    }
    res.status(500).json({ message: e.message || 'Failed to create user' })
  }
})

router.patch('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id
    const role = (req.body.role || '').toString().trim().toLowerCase()
    const password = req.body.password ? req.body.password.toString() : null

    if (!['admin', 'user'].includes(role)) return res.status(400).json({ message: 'Invalid role' })
    const passwordHash = password ? await bcrypt.hash(password, 10) : null

    const user = await updateUser({ id, role, passwordHash })
    res.json({ user })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update user' })
  }
})

router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ message: 'Invalid user id' })
    await deleteUser({ id })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete user' })
  }
})

module.exports = router

