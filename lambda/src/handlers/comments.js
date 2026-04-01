'use strict'

const { connectDB }  = require('../db/connection')
const { Post }       = require('../db/models')
const {
  ok, created, notFound, badRequest,
  parseBody, pathParam,
  isValidMongoId, withErrorHandling,
} = require('../middleware/response')

// ── GET /posts/:id/comments ────────────────────────────────────────────────────
const listComments = withErrorHandling(async (event) => {
  await connectDB()

  const postId = pathParam(event, 'id')
  if (!postId || !isValidMongoId(postId)) return badRequest('Valid post ID required')

  const post = await Post.findById(postId, 'comments').lean()
  if (!post) return notFound('Post not found')

  const comments = (post.comments || []).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )

  return ok({ comments, count: comments.length })
})

// ── POST /posts/:id/comments ───────────────────────────────────────────────────
const addComment = withErrorHandling(async (event) => {
  await connectDB()

  const postId = pathParam(event, 'id')
  if (!postId || !isValidMongoId(postId)) return badRequest('Valid post ID required')

  const { body, authorName } = parseBody(event)
  if (!body?.trim()) return badRequest('Comment body is required')
  if (body.trim().length > 2000) return badRequest('Comment too long (max 2000 chars)')

  const post = await Post.findById(postId)
  if (!post) return notFound('Post not found')

  const comment = {
    body:       body.trim(),
    authorName: authorName?.trim() || 'Anonymous',
  }

  post.comments.push(comment)
  await post.save()

  const saved = post.comments[post.comments.length - 1]
  return created({ comment: saved })
})

// ── DELETE /posts/:postId/comments/:commentId ─────────────────────────────────
const deleteComment = withErrorHandling(async (event) => {
  await connectDB()

  const postId    = pathParam(event, 'id')
  const commentId = pathParam(event, 'commentId')

  if (!postId    || !isValidMongoId(postId))    return badRequest('Valid post ID required')
  if (!commentId || !isValidMongoId(commentId)) return badRequest('Valid comment ID required')

  const post = await Post.findById(postId)
  if (!post) return notFound('Post not found')

  const idx = post.comments.findIndex(c => c._id.toString() === commentId)
  if (idx === -1) return notFound('Comment not found')

  post.comments.splice(idx, 1)
  await post.save()

  return ok({ deleted: true, commentId })
})

module.exports = { listComments, addComment, deleteComment }
