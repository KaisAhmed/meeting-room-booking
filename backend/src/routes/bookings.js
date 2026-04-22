const express = require('express')
const { requireAuth } = require('../middleware/auth')
const {
  getBookingsForRange,
  createBookingRequest,
} = require('../db/queries')

function formatLocalDateTime(date) {
  if (!date) return null
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const roomId = Number(process.env.ROOM_ID || 1)
    const role = req.user.role
    const userId = req.user.id

    const fromRaw = req.query.from
    const toRaw = req.query.to
    const statusQuery = (req.query.status || '').toString().trim().toLowerCase()

    const now = new Date()
    const fromDate = fromRaw ? new Date(fromRaw) : now
    const toDate = toRaw ? new Date(toRaw) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    if (isNaN(fromDate) || isNaN(toDate)) return res.status(400).json({ message: 'Invalid from/to' })

    let statuses = null
    if (statusQuery) {
      if (statusQuery === 'all') {
        statuses = ['pending', 'approved', 'rejected']
      } else {
        statuses = statusQuery.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      }
    }

    const rows = await getBookingsForRange({ from: fromDate, to: toDate, role, userId, roomId, statuses })

    const events = rows.map((r) => {
      const status = String(r.status || 'pending').toLowerCase()
      const statusLabels = {
        pending: 'قيد الانتظار',
        approved: 'مقبولة',
        rejected: 'مرفوضة',
      }

      const colors = {
        pending: { background: '#FFF3E0', border: '#FFB300', text: '#000' },
        approved: { background: '#E8F5E9', border: '#43A047', text: '#1B5E20' },
        rejected: { background: '#FFEBEE', border: '#E53935', text: '#B71C1C' },
      }

      const chosenColor = colors[status] || colors.pending

      const titlePrefix = status === 'approved' || status === 'pending' ? 'تم حجزه مسبقاً' : ''
      const requester = r.requestedBy || 'مستخدم'
      const reasonText = r.meeting_reason ? ` — ${r.meeting_reason}` : ''
      return {
        id: String(r.id),
        title: `${titlePrefix}${titlePrefix ? ' — ' : ''}${requester}${reasonText}`,
        start: formatLocalDateTime(r.start_time),
        end: formatLocalDateTime(r.end_time),
        backgroundColor: chosenColor.background,
        borderColor: chosenColor.border,
        textColor: chosenColor.text,
        classNames: [`booking-${status}`],
        extendedProps: {
          status,
          meetingReason: r.meeting_reason,
          bookingTypeId: r.booking_type_id,
          requestedBy: r.requestedBy,
        },
      }
    })

    res.json({ events })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load bookings' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const roomId = Number(process.env.ROOM_ID || 1)
    const userId = req.user.id

    const bookingTypeId = Number(req.body.bookingTypeId)
    const meetingReason = req.body.meetingReason || ''
    const start = new Date(req.body.start)
    const end = new Date(req.body.end)

    if (!bookingTypeId) return res.status(400).json({ message: 'bookingTypeId is required' })
    if (isNaN(start) || isNaN(end)) return res.status(400).json({ message: 'Invalid start/end' })

    const created = await createBookingRequest({
      userId,
      roomId,
      bookingTypeId,
      startTime: start,
      endTime: end,
      meetingReason,
    })

    res.status(201).json({ booking: created })
  } catch (e) {
    const statusCode = e.statusCode || 500
    res.status(statusCode).json({ message: e.message || 'Failed to create booking' })
  }
})

module.exports = router

