const { getPool, sql } = require('./pool')

async function getUserByUsername(username) {
  const pool = await getPool()
  const result = await pool
    .request()
    .input('username', sql.NVarChar(50), username)
    .query(`
      SELECT TOP 1 id, username, password_hash, role
      FROM users
      WHERE username = @username
    `)

  return result.recordset[0] || null
}

async function getBookingTypes() {
  const pool = await getPool()
  const result = await pool
    .request()
    .query(`
      SELECT id, name, color
      FROM booking_types
      ORDER BY id
    `)

  return result.recordset
}

async function getBookingsForRange({ from, to, role, userId, roomId, statuses }) {
  const pool = await getPool()

  const request = pool
    .request()
    .input('from', sql.DateTime2, from)
    .input('to', sql.DateTime2, to)
    .input('roomId', sql.Int, roomId)

  if (role !== 'admin') request.input('userId', sql.UniqueIdentifier, userId)

  const validStatuses = ['pending', 'approved', 'rejected']
  let statusClause = ''

  if (Array.isArray(statuses) && statuses.length > 0) {
    const normalized = statuses
      .map((s) => String(s || '').trim().toLowerCase())
      .filter((s) => validStatuses.includes(s))

    if (normalized.length > 0) {
      const placeholders = normalized.map((status, index) => `@status${index}`).join(', ')
      normalized.forEach((status, index) => {
        request.input(`status${index}`, sql.NVarChar(20), status)
      })
      statusClause = `AND b.status IN (${placeholders})`
      if (role !== 'admin') {
        statusClause = `AND b.user_id = @userId ${statusClause}`
      }
    }
  } else if (role === 'admin') {
    statusClause = `AND b.status IN ('approved','pending','rejected')`
  } else {
    statusClause = `AND b.user_id = @userId AND b.status IN ('approved','pending','rejected')`
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
      b.room_id = @roomId
      AND b.start_time < @to
      AND b.end_time > @from
      ${statusClause}
    ORDER BY b.start_time
  `

  const result = await request.query(query)
  return result.recordset
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
  const tx = new sql.Transaction(pool)

  await tx.begin()
  try {
    const request = new sql.Request(tx)
    request.input('roomId', sql.Int, roomId)
    request.input('userId', sql.UniqueIdentifier, userId)
    request.input('bookingTypeId', sql.Int, bookingTypeId)
    request.input('start', sql.DateTime2, startTime)
    request.input('end', sql.DateTime2, endTime)
    request.input('meetingReason', sql.NVarChar(500), meetingReason || '')

    const conflict = await request.query(`
      SELECT TOP 1 id
      FROM bookings
      WHERE
        room_id = @roomId
        AND status IN ('pending','approved')
        AND start_time < @end
        AND end_time > @start
    `)

    if (conflict.recordset.length > 0) {
      const e = new Error('Time conflict')
      e.statusCode = 409
      throw e
    }

    await request.query(`
      INSERT INTO bookings
        (room_id, user_id, booking_type_id, start_time, end_time, meeting_reason, status)
      VALUES
        (@roomId, @userId, @bookingTypeId, @start, @end, @meetingReason, 'pending')
    `)

    const insertedIdResult = await request.query(`
      SELECT TOP 1 id
      FROM bookings
      WHERE
        room_id=@roomId
        AND user_id=@userId
        AND booking_type_id=@bookingTypeId
        AND start_time=@start
        AND end_time=@end
      ORDER BY id DESC
    `)

    const insertedId = insertedIdResult.recordset[0].id
    request.input('insertedId', sql.Int, insertedId)
    const created = await request.query(`
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
      WHERE b.id=@insertedId
    `)

    created.recordset[0].id = insertedId
    await tx.commit()
    return created.recordset[0]
  } catch (err) {
    await tx.rollback()
    throw err
  }
}

async function getDashboardStats({ role, userId, roomId }) {
  const pool = await getPool()
  const request = pool.request()
  request.input('roomId', sql.Int, roomId)
  request.input('now', sql.DateTime2, new Date())
  request.input('weekEnd', sql.DateTime2, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

  const whereUser = role === 'admin' ? '' : ' AND user_id = @userId'
  if (role !== 'admin') request.input('userId', sql.UniqueIdentifier, userId)

  const query = `
    SELECT
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pendingCount,
      SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approvedCount,
      SUM(CASE WHEN status='approved' AND start_time >= @now AND start_time < @weekEnd THEN 1 ELSE 0 END) AS upcomingCount
    FROM bookings
    WHERE room_id=@roomId
      AND status IN ('pending','approved')
      ${whereUser}
  `

  const result = await request.query(query)
  const row = result.recordset[0] || {}
  return {
    pendingCount: row.pendingCount || 0,
    approvedCount: row.approvedCount || 0,
    upcomingCount: row.upcomingCount || 0,
  }
}

async function getAdminRequests({ roomId }) {
  const pool = await getPool()
  const result = await pool
    .request()
    .input('roomId', sql.Int, roomId)
    .query(`
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
        b.room_id=@roomId
        AND b.status='pending'
      ORDER BY b.start_time
    `)

  return result.recordset
}

async function getUsers() {
  const pool = await getPool()
  const result = await pool
    .request()
    .query(`
      SELECT id, username, role, created_at
      FROM users
      ORDER BY created_at DESC
    `)
  return result.recordset
}

async function createUser({ username, passwordHash, role }) {
  const pool = await getPool()
  const request = pool.request()
  request.input('username', sql.NVarChar(50), username)
  request.input('passwordHash', sql.NVarChar(255), passwordHash)
  request.input('role', sql.NVarChar(20), role)

  await request.query(`
    INSERT INTO users (username, password_hash, role)
    VALUES (@username, @passwordHash, @role)
  `)

  return getUserByUsername(username)
}

async function updateUser({ id, role, passwordHash }) {
  const pool = await getPool()
  const request = pool.request()
  request.input('id', sql.UniqueIdentifier, id)
  request.input('role', sql.NVarChar(20), role)
  const setClauses = [
    `role = @role`
  ]

  if (passwordHash) {
    request.input('passwordHash', sql.NVarChar(255), passwordHash)
    setClauses.push(`password_hash = @passwordHash`)
  }

  await request.query(`
    UPDATE users
    SET ${setClauses.join(', ')}
    WHERE id = @id
  `)

  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .query(`
      SELECT id, username, role, created_at
      FROM users
      WHERE id = @id
    `)

  return result.recordset[0]
}

async function deleteUser({ id }) {
  const pool = await getPool()
  const request = pool.request()
  request.input('id', sql.UniqueIdentifier, id)
  await request.query(`
    DELETE FROM users
    WHERE id = @id
  `)
  return true
}

async function decideBooking({ bookingId, decision, rejectReason }) {
  const pool = await getPool()
  const tx = new sql.Transaction(pool)
  await tx.begin()
  try {
    const request = new sql.Request(tx)
    request.input('id', sql.Int, bookingId)
    request.input('decision', sql.NVarChar(20), decision)
    request.input('rejectReason', sql.NVarChar(500), rejectReason || null)

    const updated = await request.query(`
      UPDATE bookings
      SET
        status = CASE WHEN @decision IN ('approved','rejected') THEN @decision ELSE status END,
        admin_reject_reason = CASE WHEN @decision='rejected' THEN @rejectReason ELSE NULL END,
        decision_at = SYSDATETIME(),
        updated_at = SYSDATETIME()
      WHERE
        id=@id
        AND status='pending';

      SELECT TOP 1 id, status
      FROM bookings
      WHERE id=@id
    `)

    const row = updated.recordset[0]
    if (!row) {
      const e = new Error('Booking not found')
      e.statusCode = 404
      throw e
    }

    // Re-check final state (if was not pending, row may still show old status).
    if (row.status !== decision) {
      const e = new Error('Unable to update booking')
      e.statusCode = 409
      throw e
    }

    await tx.commit()
    return { id: row.id, status: row.status }
  } catch (err) {
    await tx.rollback()
    throw err
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

