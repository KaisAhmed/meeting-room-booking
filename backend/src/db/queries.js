const { getPool } = require('./pool')

async function getUserByUsername(username) {
  const pool = await getPool()
  const [rows] = await pool.execute(`
    SELECT id, username, password_hash, role
    FROM users
    WHERE username = ?
    LIMIT 1
  `, [username])

  return rows[0] || null
}

async function getBookingTypes() {
  const pool = await getPool()
  const [rows] = await pool.execute(`
    SELECT id, name, color
    FROM booking_types
    ORDER BY id
  `)

  return rows
}

async function getBookingsForRange({ from, to, role, userId, roomId, statuses }) {
  const pool = await getPool()

  const params = [roomId, to, from]
  let statusClause = ''

  const validStatuses = ['pending', 'approved', 'rejected']

  if (Array.isArray(statuses) && statuses.length > 0) {
    const normalized = statuses
      .map((s) => String(s || '').trim().toLowerCase())
      .filter((s) => validStatuses.includes(s))

    if (normalized.length > 0) {
      const placeholders = normalized.map(() => '?').join(', ')
      if (role !== 'admin') {
        statusClause = `AND b.status IN (${placeholders}) AND b.user_id = ?`
        params.push(...normalized, userId)
      } else {
        statusClause = `AND b.status IN (${placeholders})`
        params.push(...normalized)
      }
    }
  } else if (role === 'admin') {
    statusClause = `AND b.status IN ('approved','pending','rejected')`
  } else {
    params.push(userId)
    statusClause = `AND b.user_id = ? AND b.status IN ('approved','pending','rejected')`
  }

  const query = `
    SELECT
      b.id,
      b.start_time,
      b.end_time,
      b.status,
      b.meeting_reason,
      b.booking_type_id,
      bt.name AS bookingTypeName,
      bt.color AS bookingTypeColor,
      u.username AS requestedBy
    FROM bookings b
    INNER JOIN booking_types bt ON bt.id = b.booking_type_id
    INNER JOIN users u ON u.id = b.user_id
    WHERE
      b.room_id = ?
      AND b.start_time < ?
      AND b.end_time > ?
      ${statusClause}
    ORDER BY b.start_time
  `

  const [rows] = await pool.execute(query, params)
  return rows
}

async function createBookingRequest({
  userId,
  roomId,
  bookingTypeId,
  startTime,
  endTime,
  meetingReason,
}) {
  if (!(startTime instanceof Date) || !(endTime instanceof Date) || isNaN(startTime) || isNaN(endTime)) {
    const e = new Error('Invalid start/end time')
    e.statusCode = 400
    throw e
  }
  if (endTime <= startTime) {
    const e = new Error('end time must be after start time')
    e.statusCode = 400
    throw e
  }

  const pool = await getPool()
  const connection = await pool.getConnection()

  await connection.beginTransaction()
  try {
    // Check for conflicts
    const [conflictRows] = await connection.execute(`
      SELECT id
      FROM bookings
      WHERE
        room_id = ?
        AND status IN ('pending','approved')
        AND start_time < ?
        AND end_time > ?
      LIMIT 1
    `, [roomId, endTime, startTime])

    if (conflictRows.length > 0) {
      const e = new Error('Time conflict')
      e.statusCode = 409
      throw e
    }

    // Insert booking
    await connection.execute(`
      INSERT INTO bookings
        (room_id, user_id, booking_type_id, start_time, end_time, meeting_reason, status)
      VALUES
        (?, ?, ?, ?, ?, ?, 'pending')
    `, [roomId, userId, bookingTypeId, startTime, endTime, meetingReason || ''])

    // Get the inserted ID
    const [idRows] = await connection.execute(`
      SELECT LAST_INSERT_ID() as id
    `)
    const insertedId = idRows[0].id

    // Get the created booking
    const [createdRows] = await connection.execute(`
      SELECT
        b.id,
        b.start_time,
        b.end_time,
        b.status,
        b.meeting_reason,
        b.booking_type_id,
        bt.name AS bookingTypeName,
        bt.color AS bookingTypeColor,
        u.username AS requestedBy
      FROM bookings b
      INNER JOIN booking_types bt ON bt.id=b.booking_type_id
      INNER JOIN users u ON u.id=b.user_id
      WHERE b.id=?
    `, [insertedId])

    await connection.commit()
    return createdRows[0]
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

async function getDashboardStats({ role, userId, roomId }) {
  const pool = await getPool()
  const params = [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), roomId]

  const whereUser = role === 'admin' ? '' : ' AND user_id = ?'
  if (role !== 'admin') params.push(userId)

  const query = `
    SELECT
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pendingCount,
      SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approvedCount,
      SUM(CASE WHEN status='approved' AND start_time >= ? AND start_time < ? THEN 1 ELSE 0 END) AS upcomingCount
    FROM bookings
    WHERE room_id=?
      AND status IN ('pending','approved')
      ${whereUser}
  `

  const [rows] = await pool.execute(query, params)
  const row = rows[0] || {}
  return {
    pendingCount: row.pendingCount || 0,
    approvedCount: row.approvedCount || 0,
    upcomingCount: row.upcomingCount || 0,
  }
}

async function getAdminRequests({ roomId }) {
  const pool = await getPool()
  const [rows] = await pool.execute(`
    SELECT
      b.id,
      b.start_time,
      b.end_time,
      b.status,
      b.meeting_reason,
      b.booking_type_id,
      bt.name AS bookingTypeName,
      bt.color AS bookingTypeColor,
      u.username AS requestedBy
    FROM bookings b
    INNER JOIN booking_types bt ON bt.id=b.booking_type_id
    INNER JOIN users u ON u.id=b.user_id
    WHERE
      b.room_id=?
      AND b.status='pending'
    ORDER BY b.start_time
  `, [roomId])

  return rows
}

async function getUsers() {
  const pool = await getPool()
  const [rows] = await pool.execute(`
    SELECT id, username, role, created_at
    FROM users
    ORDER BY created_at DESC
  `)
  return rows
}

async function createUser({ username, passwordHash, role }) {
  const pool = await getPool()
  await pool.execute(`
    INSERT INTO users (username, password_hash, role)
    VALUES (?, ?, ?)
  `, [username, passwordHash, role])

  return getUserByUsername(username)
}

async function updateUser({ id, role, passwordHash }) {
  const pool = await getPool()
  const setClauses = [
    'role = ?'
  ]
  const params = [role, id]

  if (passwordHash) {
    setClauses.push('password_hash = ?')
    params.unshift(passwordHash)
  }

  await pool.execute(`
    UPDATE users
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `, params)

  const [rows] = await pool.execute(`
    SELECT id, username, role, created_at
    FROM users
    WHERE id = ?
  `, [id])

  return rows[0]
}

async function deleteUser({ id }) {
  const pool = await getPool()
  await pool.execute(`
    DELETE FROM users
    WHERE id = ?
  `, [id])
  return true
}

async function decideBooking({ bookingId, decision, rejectReason }) {
  const pool = await getPool()
  const connection = await pool.getConnection()

  await connection.beginTransaction()
  try {
    await connection.execute(`
      UPDATE bookings
      SET
        status = CASE WHEN ? IN ('approved','rejected') THEN ? ELSE status END,
        admin_reject_reason = CASE WHEN ?='rejected' THEN ? ELSE NULL END,
        decision_at = NOW(),
        updated_at = NOW()
      WHERE
        id=?
        AND status='pending'
    `, [decision, decision, decision, rejectReason || null, bookingId])

    const [rows] = await connection.execute(`
      SELECT id, status
      FROM bookings
      WHERE id=?
    `, [bookingId])

    const row = rows[0]
    if (!row) {
      const e = new Error('Booking not found')
      e.statusCode = 404
      throw e
    }

    // Check if was not pending, row may still show old status
    if (row.status !== decision) {
      const e = new Error('Unable to update booking')
      e.statusCode = 409
      throw e
    }

    await connection.commit()
    return { id: row.id, status: row.status }
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

module.exports = {
  getUserByUsername,
  getBookingTypes,
  getBookingsForRange,
  createBookingRequest,
  getDashboardStats,
  getAdminRequests,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  decideBooking,
}

