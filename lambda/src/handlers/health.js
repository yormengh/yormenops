'use strict'

const mongoose        = require('mongoose')
const { connectDB }   = require('../db/connection')
const { ok, serverErr, withErrorHandling } = require('../middleware/response')

const healthCheck = withErrorHandling(async () => {
  const start = Date.now()

  try {
    await connectDB()
    await mongoose.connection.db.admin().ping()
    const dbLatencyMs = Date.now() - start

    return ok({
      status:    'ok',
      service:   'yormenops-api',
      db:        'connected',
      dbLatencyMs,
      region:    process.env.AWS_REGION || 'us-east-2',
      runtime:   process.version,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return serverErr(`DB unavailable: ${err.message}`)
  }
})

module.exports = { healthCheck }
