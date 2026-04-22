-- SQL Server schema initialization for MeetingBooking.
-- Run this in your target database (e.g., MeetingBooking).

SET NOCOUNT ON;

IF OBJECT_ID('dbo.rooms', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.rooms (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL
  );
END

IF OBJECT_ID('dbo.booking_types', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.booking_types (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    color NVARCHAR(50) NOT NULL
  );
END

IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.users (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'user',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END

IF OBJECT_ID('dbo.bookings', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.bookings (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    room_id INT NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    booking_type_id INT NOT NULL,
    start_time DATETIME2 NOT NULL,
    end_time DATETIME2 NOT NULL,
    meeting_reason NVARCHAR(500) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|approved|rejected
    admin_reject_reason NVARCHAR(500) NULL,
    decision_at DATETIME2 NULL,
    requested_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );

  CREATE INDEX IX_bookings_room_time ON dbo.bookings(room_id, start_time);
END

-- Session store table required by connect-mssql-v2
IF OBJECT_ID('dbo.sessions', 'U') IS NOT NULL
BEGIN
  -- Drop existing table if it has wrong schema (session_id instead of sid)
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.sessions') AND name = 'sid')
  BEGIN
    DROP TABLE dbo.sessions;
  END
END

IF OBJECT_ID('dbo.sessions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.sessions (
    sid NVARCHAR(255) NOT NULL PRIMARY KEY,
    expires DATETIME2 NOT NULL,
    session NVARCHAR(MAX) NOT NULL
  );
END

-- Seed default room (id=1 is expected by backend env ROOM_ID=1)
IF NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE id = 1)
BEGIN
  SET IDENTITY_INSERT dbo.rooms ON;
  INSERT INTO dbo.rooms (id, name) VALUES (1, N'قاعة الاجتماعات');
  SET IDENTITY_INSERT dbo.rooms OFF;
END

-- Seed booking types for calendar colors
IF NOT EXISTS (SELECT 1 FROM dbo.booking_types WHERE name = N'اجتماع')
BEGIN
  INSERT INTO dbo.booking_types (name, color) VALUES (N'اجتماع', N'#1976d2');
END

IF NOT EXISTS (SELECT 1 FROM dbo.booking_types WHERE name = N'مناقشة')
BEGIN
  INSERT INTO dbo.booking_types (name, color) VALUES (N'مناقشة', N'#ef5350');
END

IF NOT EXISTS (SELECT 1 FROM dbo.booking_types WHERE name = N'تقييم')
BEGIN
  INSERT INTO dbo.booking_types (name, color) VALUES (N'تقييم', N'#43a047');
END

