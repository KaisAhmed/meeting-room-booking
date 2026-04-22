const express = require('express')
const { requireAuth } = require('../middleware/auth')
const { getBookingTypes } = require('../db/queries')

const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const types = await getBookingTypes()
    res.json({ types })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load booking types' })
  }
})

module.exports = router

