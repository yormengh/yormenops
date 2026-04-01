'use strict'

const mongoose = require('mongoose')
const slugify  = require('slugify')

// ── Comment schema (embedded in Post) ────────────────────────────────────────
const CommentSchema = new mongoose.Schema({
  authorName: { type: String, default: 'Anonymous', maxlength: 100, trim: true },
  body:       { type: String, required: true, maxlength: 2000, trim: true },
}, { timestamps: true })

// ── Reactions schema ──────────────────────────────────────────────────────────
const ReactionsSchema = new mongoose.Schema({
  fire:   { type: Number, default: 0, min: 0 },
  rocket: { type: Number, default: 0, min: 0 },
  brain:  { type: Number, default: 0, min: 0 },
  bug:    { type: Number, default: 0, min: 0 },
  star:   { type: Number, default: 0, min: 0 },
}, { _id: false })

// ── Post schema ───────────────────────────────────────────────────────────────
const PostSchema = new mongoose.Schema({
  title:      { type: String, required: true, maxlength: 300, trim: true },
  slug:       { type: String, unique: true, index: true },
  body:       { type: String, required: true },
  excerpt:    { type: String, maxlength: 300 },
  authorName: { type: String, default: 'Moses Amartey', maxlength: 100, trim: true },
  tags:       { type: [String], default: [], index: true },
  readTime:   { type: Number, default: 1, min: 1 },
  reactions:  { type: ReactionsSchema, default: () => ({}) },
  comments:   { type: [CommentSchema], default: [] },
  views:      { type: Number, default: 0, min: 0 },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
})

// ── Virtual: comment count ────────────────────────────────────────────────────
PostSchema.virtual('commentCount').get(function () {
  return this.comments.length
})

// ── Pre-save hooks ────────────────────────────────────────────────────────────
PostSchema.pre('save', function (next) {
  // Auto-generate slug from title
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true, trim: true })
  }

  // Auto-generate excerpt from body (strip markdown syntax)
  if (this.isModified('body') || !this.excerpt) {
    const plain = this.body
      .replace(/```[\s\S]*?```/g, '')   // strip code blocks
      .replace(/`[^`]+`/g, '')          // strip inline code
      .replace(/#{1,6}\s+/g, '')        // strip headers
      .replace(/\*\*|__|\*|_/g, '')     // strip bold/italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // unwrap links
      .replace(/>\s+/g, '')             // strip blockquotes
      .replace(/\n+/g, ' ')            // collapse newlines
      .trim()
    this.excerpt = plain.slice(0, 280) + (plain.length > 280 ? '...' : '')
  }

  // Auto-calculate read time (~200wpm)
  this.readTime = Math.max(1, Math.ceil(this.body.split(/\s+/).length / 200))

  next()
})

// ── Indexes ───────────────────────────────────────────────────────────────────
PostSchema.index({ createdAt: -1 })
PostSchema.index({ tags: 1, createdAt: -1 })
PostSchema.index({ title: 'text', body: 'text' })

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema)

module.exports = { Post }
