#!/usr/bin/env node
'use strict'

/**
 * YormenOps — Local Lambda Dev Server
 * Simulates API Gateway HTTP API v2 events so you can test handlers locally.
 *
 * Usage:
 *   MONGODB_URI=mongodb://localhost:27017/yormenops node src/local.js
 *
 * Endpoints mirror the API Gateway routes exactly.
 */

require('dotenv').config({ path: '../.env.local' })

const http = require('http')
const url  = require('url')

const { listPosts, getPost, createPost, updatePost, deletePost, reactToPost, listTags } = require('./handlers/posts')
const { listComments, addComment, deleteComment } = require('./handlers/comments')
const { healthCheck }  = require('./handlers/health')
const { seedDatabase } = require('./handlers/seed')

const PORT = process.env.LOCAL_PORT || 4000

// ── Build a fake API Gateway v2 HTTP event from an incoming Node request ──────
async function buildEvent(req, params = {}) {
  const parsed = url.parse(req.url, true)

  const body = await new Promise((resolve) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data || null))
  })

  return {
    rawPath:            parsed.pathname,
    requestContext:     { http: { method: req.method, path: parsed.pathname } },
    queryStringParameters: parsed.query || {},
    pathParameters:     params,
    headers:            req.headers,
    body,
    isBase64Encoded:    false,
  }
}

// ── Route matcher ─────────────────────────────────────────────────────────────
async function router(req, res) {
  const method  = req.method.toUpperCase()
  const path    = url.parse(req.url).pathname

  let handler = null
  let params  = {}

  const postIdMatch      = path.match(/^\/api\/posts\/([^/]+)$/)
  const commentMatch     = path.match(/^\/api\/posts\/([^/]+)\/comments$/)
  const commentDelMatch  = path.match(/^\/api\/posts\/([^/]+)\/comments\/([^/]+)$/)
  const reactMatch       = path.match(/^\/api\/posts\/([^/]+)\/react$/)

  if (path === '/api/health' && method === 'GET') {
    handler = healthCheck
  } else if (path === '/api/seed' && method === 'POST') {
    handler = seedDatabase
  } else if (path === '/api/tags' && method === 'GET') {
    handler = listTags
  } else if (path === '/api/posts' && method === 'GET') {
    handler = listPosts
  } else if (path === '/api/posts' && method === 'POST') {
    handler = createPost
  } else if (reactMatch && method === 'POST') {
    params  = { id: reactMatch[1] }
    handler = reactToPost
  } else if (commentDelMatch && method === 'DELETE') {
    params  = { id: commentDelMatch[1], commentId: commentDelMatch[2] }
    handler = deleteComment
  } else if (commentMatch && method === 'GET') {
    params  = { id: commentMatch[1] }
    handler = listComments
  } else if (commentMatch && method === 'POST') {
    params  = { id: commentMatch[1] }
    handler = addComment
  } else if (postIdMatch && method === 'GET') {
    params  = { id: postIdMatch[1] }
    handler = getPost
  } else if (postIdMatch && method === 'PUT') {
    params  = { id: postIdMatch[1] }
    handler = updatePost
  } else if (postIdMatch && method === 'DELETE') {
    params  = { id: postIdMatch[1] }
    handler = deletePost
  }

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: `No route for ${method} ${path}` }))
    return
  }

  try {
    const event  = await buildEvent(req, params)
    const result = await handler(event, { callbackWaitsForEmptyEventLoop: false })

    Object.entries(result.headers || {}).forEach(([k, v]) => res.setHeader(k, v))
    res.writeHead(result.statusCode || 200)
    res.end(result.body || '')
  } catch (err) {
    console.error('[Local Server Error]', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
  }
}

const server = http.createServer(router)

server.listen(PORT, () => {
  console.log(`\n🛸 YormenOps local API running on http://localhost:${PORT}`)
  console.log(`   MongoDB: ${process.env.MONGODB_URI || '⚠ MONGODB_URI not set'}`)
  console.log('\nAvailable routes:')
  console.log('  GET    /api/health')
  console.log('  GET    /api/posts')
  console.log('  POST   /api/posts')
  console.log('  GET    /api/posts/:id')
  console.log('  PUT    /api/posts/:id')
  console.log('  DELETE /api/posts/:id')
  console.log('  POST   /api/posts/:id/react')
  console.log('  GET    /api/posts/:id/comments')
  console.log('  POST   /api/posts/:id/comments')
  console.log('  DELETE /api/posts/:id/comments/:commentId')
  console.log('  GET    /api/tags')
  console.log('  POST   /api/seed\n')
})
