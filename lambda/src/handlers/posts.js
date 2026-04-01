'use strict'

const { connectDB }   = require('../db/connection')
const { Post }        = require('../db/models')
const {
  ok, created, notFound, badRequest,
  parseBody, pathParam, queryParam,
  isValidMongoId, VALID_REACTIONS,
  withErrorHandling,
} = require('../middleware/response')

// ── GET /posts ─────────────────────────────────────────────────────────────────
const listPosts = withErrorHandling(async (event) => {
  await connectDB()

  const tag    = queryParam(event, 'tag')
  const limit  = Math.min(parseInt(queryParam(event, 'limit',  '20')), 50)
  const skip   = parseInt(queryParam(event, 'offset', '0'))
  const search = queryParam(event, 'q')

  const filter = {}
  if (tag)    filter.tags   = tag.toLowerCase()
  if (search) filter.$text  = { $search: search }

  const projection = {
    title: 1, slug: 1, excerpt: 1, authorName: 1,
    tags: 1, readTime: 1, reactions: 1, views: 1,
    createdAt: 1, updatedAt: 1,
    commentCount: { $size: '$comments' },
  }

  const posts = await Post.aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $addFields: { commentCount: { $size: '$comments' } } },
    { $project: { comments: 0, body: 0, __v: 0 } },
  ])

  const total = await Post.countDocuments(filter)

  return ok({ posts, total, limit, offset: skip })
})

// ── GET /posts/:id ─────────────────────────────────────────────────────────────
const getPost = withErrorHandling(async (event) => {
  await connectDB()

  const id = pathParam(event, 'id')
  if (!id) return badRequest('Post ID is required')

  const filter = isValidMongoId(id) ? { _id: id } : { slug: id }

  const post = await Post.findOneAndUpdate(
    filter,
    { $inc: { views: 1 } },  // Increment view count on read
    { new: true }
  ).lean({ virtuals: true })

  if (!post) return notFound('Post not found')

  return ok({ post })
})

// ── POST /posts ────────────────────────────────────────────────────────────────
const createPost = withErrorHandling(async (event) => {
  await connectDB()

  const body = parseBody(event)
  const { title, body: postBody, authorName, tags } = body

  if (!title?.trim())    return badRequest('title is required')
  if (!postBody?.trim()) return badRequest('body is required')

  const sanitizedTags = (tags || [])
    .map(t => String(t).toLowerCase().trim().replace(/\s+/g, '-'))
    .filter(Boolean)
    .slice(0, 8)

  const post = new Post({
    title:      title.trim(),
    body:       postBody.trim(),
    authorName: authorName?.trim() || 'Moses Amartey',
    tags:       sanitizedTags,
  })

  await post.save()

  return created({ post })
})

// ── PUT /posts/:id ─────────────────────────────────────────────────────────────
const updatePost = withErrorHandling(async (event) => {
  await connectDB()

  const id = pathParam(event, 'id')
  if (!id || !isValidMongoId(id)) return badRequest('Valid post ID is required')

  const body = parseBody(event)
  const { title, body: postBody, authorName, tags } = body

  const updates = {}
  if (title)      updates.title      = title.trim()
  if (postBody)   updates.body       = postBody.trim()
  if (authorName) updates.authorName = authorName.trim()
  if (tags)       updates.tags       = tags.map(t => t.toLowerCase().trim()).filter(Boolean)

  // Clear cached excerpt/slug so pre-save hook regenerates them
  if (title)    { updates.slug    = undefined }
  if (postBody) { updates.excerpt = undefined }

  const post = await Post.findById(id)
  if (!post) return notFound('Post not found')

  Object.assign(post, updates)
  await post.save()

  return ok({ post })
})

// ── DELETE /posts/:id ──────────────────────────────────────────────────────────
const deletePost = withErrorHandling(async (event) => {
  await connectDB()

  const id = pathParam(event, 'id')
  if (!id || !isValidMongoId(id)) return badRequest('Valid post ID is required')

  const post = await Post.findByIdAndDelete(id)
  if (!post) return notFound('Post not found')

  return ok({ deleted: true, id })
})

// ── POST /posts/:id/react ─────────────────────────────────────────────────────
const reactToPost = withErrorHandling(async (event) => {
  await connectDB()

  const id = pathParam(event, 'id')
  if (!id || !isValidMongoId(id)) return badRequest('Valid post ID is required')

  const { reaction } = parseBody(event)
  if (!reaction || !VALID_REACTIONS.has(reaction)) {
    return badRequest(`reaction must be one of: ${[...VALID_REACTIONS].join(', ')}`)
  }

  const post = await Post.findByIdAndUpdate(
    id,
    { $inc: { [`reactions.${reaction}`]: 1 } },
    { new: true, select: 'reactions' }
  ).lean()

  if (!post) return notFound('Post not found')

  return ok({ reactions: post.reactions })
})

// ── GET /posts/tags ───────────────────────────────────────────────────────────
const listTags = withErrorHandling(async () => {
  await connectDB()

  const tags = await Post.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort:  { count: -1, _id: 1 } },
    { $project: { tag: '$_id', count: 1, _id: 0 } },
  ])

  return ok({ tags })
})

module.exports = { listPosts, getPost, createPost, updatePost, deletePost, reactToPost, listTags }
