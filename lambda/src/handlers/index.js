'use strict'

/**
 * Route dispatcher — maps API Gateway v2 routeKey to the correct handler.
 * All post/tag routes are handled by a single Lambda function.
 */

const {
  listPosts, getPost, createPost, updatePost,
  deletePost, reactToPost, listTags,
} = require('./posts')

const { listComments, addComment, deleteComment } = require('./comments')
const { healthCheck }  = require('./health')
const { seedDatabase } = require('./seed')

const ROUTES = {
  'GET /api/health':                              healthCheck,
  'POST /api/seed':                               seedDatabase,
  'GET /api/tags':                                listTags,
  'GET /api/posts':                               listPosts,
  'POST /api/posts':                              createPost,
  'GET /api/posts/{id}':                          getPost,
  'PUT /api/posts/{id}':                          updatePost,
  'DELETE /api/posts/{id}':                       deletePost,
  'POST /api/posts/{id}/react':                   reactToPost,
  'GET /api/posts/{id}/comments':                 listComments,
  'POST /api/posts/{id}/comments':                addComment,
  'DELETE /api/posts/{id}/comments/{commentId}':  deleteComment,
}

async function handler(event, context) {
  const routeKey = event.routeKey || `${event.requestContext?.http?.method} ${event.rawPath}`
  const fn = ROUTES[routeKey]

  if (!fn) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `No handler for ${routeKey}` }),
    }
  }

  return fn(event, context)
}

module.exports = { handler }
