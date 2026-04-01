'use strict'

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

// ── Standard API Gateway v2 response builder ──────────────────────────────────
function response(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type,Authorization,X-Api-Key',
      'X-Service':                   'yormenops-api',
      'X-Region':                    process.env.AWS_REGION || 'us-east-2',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

const ok       = (data)  => response(200, data)
const created  = (data)  => response(201, data)
const noContent = ()     => response(204, null)
const badRequest = (msg) => response(400, { error: msg || 'Bad request' })
const notFound  = (msg)  => response(404, { error: msg || 'Not found' })
const serverErr = (msg)  => response(500, { error: msg || 'Internal server error' })

// ── CORS preflight handler ────────────────────────────────────────────────────
function handleCors(event) {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return response(200, {})
  }
  return null
}

// ── Body parser ───────────────────────────────────────────────────────────────
function parseBody(event) {
  if (!event.body) return {}
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

// ── Path parameter extractor ──────────────────────────────────────────────────
function pathParam(event, key) {
  return event.pathParameters?.[key] || null
}

// ── Query string extractor ────────────────────────────────────────────────────
function queryParam(event, key, defaultVal = null) {
  return event.queryStringParameters?.[key] ?? defaultVal
}

// ── Validation helpers ────────────────────────────────────────────────────────
function isValidMongoId(id) {
  return /^[a-f\d]{24}$/i.test(id)
}

const VALID_REACTIONS = new Set(['fire', 'rocket', 'brain', 'bug', 'star'])

// ── Lambda handler wrapper — catches unhandled errors gracefully ──────────────
function withErrorHandling(handler) {
  return async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false // Allow DB connection reuse

    // CORS preflight
    const corsResponse = handleCors(event)
    if (corsResponse) return corsResponse

    try {
      return await handler(event, context)
    } catch (err) {
      console.error('[Handler Error]', {
        message: err.message,
        stack:   process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        path:    event.rawPath,
        method:  event.requestContext?.http?.method,
      })

      if (err.name === 'ValidationError') {
        const msg = Object.values(err.errors).map(e => e.message).join(', ')
        return badRequest(msg)
      }
      if (err.name === 'CastError') return badRequest('Invalid ID format')
      if (err.code === 11000)       return badRequest('Duplicate entry')

      return serverErr()
    }
  }
}

module.exports = {
  response, ok, created, noContent, badRequest, notFound, serverErr,
  handleCors, parseBody, pathParam, queryParam,
  isValidMongoId, VALID_REACTIONS,
  withErrorHandling,
}
