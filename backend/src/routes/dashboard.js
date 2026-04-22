const express = require('express')
const { getDashboardStats } = require('../db/queries')

const router = express.Router()

router.get('/', async (req, res) => {
  const role = req.user.role
  const userId = req.user.id
  const roomId = Number(process.env.ROOM_ID || 1)

  const stats = await getDashboardStats({ role, userId, roomId })
  res.json(stats)
})

module.exports = router

