'use strict'

const mongoose = require('mongoose')

// ── Connection cache ──────────────────────────────────────────────────────────
// Lambda keeps the execution environment warm between invocations.
// We cache the connection so subsequent calls reuse the same socket
// instead of opening a new one every time.
let cachedConnection = null

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection
  }

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not set')

  const opts = {
    // Lambda-optimised settings
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS:          30000,
    connectTimeoutMS:         10000,
    maxPoolSize:              1,   // One connection per Lambda instance
    minPoolSize:              0,
    // Keep alive to avoid stale connections on warm instances
    family:                   4,
  }

  try {
    cachedConnection = await mongoose.connect(uri, opts)
    console.log('[DB] MongoDB connected')
    return cachedConnection
  } catch (err) {
    cachedConnection = null
    console.error('[DB] Connection failed:', err.message)
    throw err
  }
}

module.exports = { connectDB }
