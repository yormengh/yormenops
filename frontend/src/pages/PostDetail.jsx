import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import { formatDistanceToNow, format } from 'date-fns'
import { ArrowLeft, Pencil, Trash2, MessageSquare, Send, Copy, Check, Share2, BookOpen, Eye, List } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPost, deletePost, reactToPost, getComments, addComment, deleteComment } from '../utils/api.js'
import { getTagStyle, REACTIONS } from '../utils/tags.js'

// Extract headings from markdown for table of contents
function extractHeadings(markdown) {
  const lines = markdown?.split('\n') || []
  return lines
    .filter(l => /^#{1,3} /.test(l))
    .map(l => {
      const level = l.match(/^(#+)/)[1].length
      const text  = l.replace(/^#+\s/, '').trim()
      const slug  = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return { level, text, slug }
    })
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost]           = useState(null)
  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [reactions, setReactions] = useState({})
  const [voted, setVoted]         = useState({})
  const [comment, setComment]     = useState('')
  const [commenterName, setCommenterName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const [tocOpen, setTocOpen]     = useState(false)
  const articleRef = useRef(null)

  useEffect(() => {
    Promise.all([getPost(id), getComments(id)])
      .then(([postRes, cmtRes]) => {
        const p = postRes.data.post
        setPost(p)
        setComments(cmtRes.data.comments || [])
        setReactions(p.reactions || {})
        document.title = `${p.title} — YormenOps`
      })
      .catch(() => toast.error('Post not found'))
      .finally(() => setLoading(false))
  }, [id])

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      const winH = window.innerHeight
      const pct = Math.min(100, Math.max(0, ((winH - top) / (height + winH)) * 100))
      setScrollPct(pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [loading])

  const handleReact = async (key) => {
    if (voted[key]) return
    try {
      const res = await reactToPost(id, key)
      setReactions(res.data.reactions || {})
      setVoted(prev => ({ ...prev, [key]: true }))
    } catch { toast.error('Reaction failed') }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    try {
      await deletePost(id)
      toast.success('Post deleted')
      navigate('/')
    } catch { toast.error('Delete failed') }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      const res = await addComment(id, { body: comment.trim(), authorName: commenterName || 'Anonymous' })
      setComments(prev => [...prev, res.data.comment])
      setComment('')
      toast.success('Comment posted!')
    } catch { toast.error('Comment failed') }
    setSubmitting(false)
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(id, commentId)
      setComments(prev => prev.filter(c => (c._id || c.id) !== commentId))
    } catch { toast.error('Failed to delete comment') }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  if (loading) return <LoadingState />
  if (!post) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
      Post not found.
    </div>
  )

  const totalReactions = Object.values(reactions).reduce((s, v) => s + (v || 0), 0)
  const headings = extractHeadings(post.body)

  return (
    <>
      {/* Reading progress bar */}
      <div style={{
        position: 'fixed', top: 58, left: 0, right: 0, height: 2, zIndex: 99,
        background: 'var(--border-muted)',
      }}>
        <motion.div style={{
          height: '100%', background: 'var(--accent)',
          width: `${scrollPct}%`, transition: 'width 0.1s linear',
        }} />
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 100px' }}>

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.04em',
            color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 36,
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={12} /> Back to feed
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {post.tags.map(tag => {
                const { className, label } = getTagStyle(tag)
                return (
                  <Link key={tag} to={`/tag/${tag}`} className={`tag ${className}`} style={{ textDecoration: 'none' }}>
                    {label}
                  </Link>
                )
              })}
            </div>
          )}

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(1.6rem, 4vw, 2.3rem)',
            lineHeight: 1.2, letterSpacing: '-0.02em',
            color: 'var(--text-primary)', marginBottom: 24,
          }}>{post.title}</h1>

          {/* Meta row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12, marginBottom: 32,
            paddingBottom: 24, borderBottom: '1px solid var(--border-muted)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: '#0a0a0a', fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}>
                {(post.authorName || 'MA').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {post.authorName || 'Moses Amartey'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  <span>{post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy') : ''}</span>
                  {post.readTime && <><span>·</span><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><BookOpen size={9} />{post.readTime} min read</span></>}
                  {post.views > 0 && <><span>·</span><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={9} />{post.views} views</span></>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6 }}>
              {headings.length > 0 && (
                <button onClick={() => setTocOpen(o => !o)} className="btn-ghost" style={{ padding: '6px 11px', position: 'relative' }}>
                  <List size={12} /> Contents
                </button>
              )}
              <button onClick={handleShare} className="btn-ghost" style={{ padding: '6px 11px' }}>
                <Share2 size={12} /> Share
              </button>
              <Link to={`/edit/${post._id}`} className="btn-ghost" style={{ padding: '6px 11px' }}>
                <Pencil size={12} /> Edit
              </Link>
              <button onClick={handleDelete} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 11px', background: 'transparent',
                border: '1px solid rgba(224,92,92,0.25)',
                color: 'var(--red)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em',
                textTransform: 'uppercase', transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,92,92,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Table of contents */}
          <AnimatePresence>
            {tocOpen && headings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 28 }}
              >
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
                  borderLeft: '3px solid var(--accent)',
                  borderRadius: 'var(--radius)', padding: '16px 20px',
                }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Contents
                  </p>
                  <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {headings.map((h, i) => (
                      <li key={i} style={{ paddingLeft: (h.level - 1) * 14 }}>
                        <a href={`#${h.slug}`} onClick={() => setTocOpen(false)} style={{
                          fontFamily: 'var(--font-body)', fontSize: '0.83rem',
                          color: h.level === 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                          textDecoration: 'none', transition: 'color 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = h.level === 1 ? 'var(--text-primary)' : 'var(--text-secondary)'}
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Article body */}
        <motion.div
          ref={articleRef}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-lg)', padding: 'clamp(22px, 4vw, 44px)',
            marginBottom: 32,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {post.body}
          </ReactMarkdown>
        </motion.div>

        {/* Reactions */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 40,
          }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14, textAlign: 'center' }}>
            Found this useful? React · {totalReactions} total
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {REACTIONS.map(r => (
              <motion.button
                key={r.key}
                whileHover={!voted[r.key] ? { scale: 1.08 } : {}}
                whileTap={!voted[r.key] ? { scale: 0.95 } : {}}
                onClick={() => handleReact(r.key)}
                title={r.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                  cursor: voted[r.key] ? 'default' : 'pointer',
                  background: voted[r.key] ? 'var(--accent-dim)' : 'var(--bg-subtle)',
                  border: `1px solid ${voted[r.key] ? 'rgba(201,168,76,0.35)' : 'var(--border-muted)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{r.emoji}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: voted[r.key] ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {r.label} · {reactions[r.key] || 0}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Comments */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-muted)' }}>
            <MessageSquare size={14} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {comments.length} Comment{comments.length !== 1 ? 's' : ''}
            </h3>
          </div>

          {/* Comment form */}
          <form onSubmit={handleComment} style={{ marginBottom: 28 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={commenterName}
                onChange={e => setCommenterName(e.target.value)}
                placeholder="Your name (optional)"
                style={inputStyle}
              />
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your thoughts or questions..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={submitting || !comment.trim()} className="btn-primary"
                  style={{ opacity: submitting || !comment.trim() ? 0.45 : 1 }}>
                  <Send size={11} /> {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </form>

          {/* Comments list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.length === 0 && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                No comments yet. Be the first.
              </p>
            )}
            {comments.map((c, i) => {
              const cid = c._id || c.id
              return (
                <motion.div key={cid || i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius)', padding: '14px 18px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-hover)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                      }}>
                        {(c.authorName || 'AN').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {c.authorName || 'Anonymous'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteComment(cid)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, transition: 'color 0.15s', display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.7, margin: 0 }}>{c.body}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </>
  )
}

// Markdown heading renderer with anchor IDs for TOC
function Heading({ level, children }) {
  const text = typeof children === 'string' ? children : children?.toString() || ''
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const sizes = { 1: '1.65rem', 2: '1.28rem', 3: '1.05rem' }
  const colors = { 1: 'var(--text-primary)', 2: 'var(--text-primary)', 3: 'var(--accent)' }
  const Tag = `h${level}`
  return (
    <Tag id={slug} style={{
      fontFamily: 'var(--font-display)', fontWeight: level === 1 ? 700 : 600,
      fontSize: sizes[level] || '1rem', color: colors[level] || 'var(--text-primary)',
      margin: level === 1 ? '2rem 0 1rem' : '1.6rem 0 0.7rem',
      paddingBottom: level === 1 ? '0.5rem' : 0,
      borderBottom: level === 1 ? '1px solid var(--border-muted)' : 'none',
      scrollMarginTop: 80,
    }}>
      {children}
    </Tag>
  )
}

const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match
      ? <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
      : <code style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.83em',
          background: 'rgba(201,168,76,0.1)', color: 'var(--accent)',
          padding: '2px 6px', borderRadius: 3,
          border: '1px solid rgba(201,168,76,0.18)',
        }} {...props}>{children}</code>
  },
  h1: ({ children }) => <Heading level={1}>{children}</Heading>,
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  p:  ({ children }) => <p style={{ color: 'var(--text-secondary)', lineHeight: 1.85, marginBottom: '1.1rem', fontSize: '0.95rem', fontFamily: 'var(--font-body)' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.4rem', marginBottom: '1.1rem', lineHeight: 1.9, fontFamily: 'var(--font-body)' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ color: 'var(--text-secondary)', paddingLeft: '1.4rem', marginBottom: '1.1rem', lineHeight: 1.9, fontFamily: 'var(--font-body)' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '0.25rem', fontSize: '0.95rem' }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: '3px solid var(--accent)', paddingLeft: '1.1rem',
      margin: '1.4rem 0', color: 'var(--text-muted)', fontStyle: 'italic',
      background: 'rgba(201,168,76,0.04)', borderRadius: '0 4px 4px 0', padding: '10px 16px',
    }}>{children}</blockquote>
  ),
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{children}</a>,
  strong: ({ children }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border-muted)', margin: '2rem 0' }} />,
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', marginBottom: '1.4rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-muted)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
    </div>
  ),
  th: ({ children }) => <th style={{ padding: '9px 14px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</th>,
  td: ({ children }) => <td style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-muted)', color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'var(--font-body)' }}>{children}</td>,
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ marginBottom: '1.4rem', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-muted)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{language}</span>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', transition: 'color 0.15s' }}>
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <SyntaxHighlighter language={language} style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.83rem', background: '#0d1117', padding: '18px 20px' }}
        showLineNumbers lineNumberStyle={{ color: 'var(--text-muted)', fontSize: '0.72rem', userSelect: 'none' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '60px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[60, 100, 80, 100, 70, 100, 90].map((w, i) => (
        <div key={i} style={{
          height: i === 1 ? 36 : 14, width: `${w}%`, borderRadius: 6,
          background: `linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%)`,
          backgroundSize: '600px 100%', animation: `shimmer 1.6s infinite`,
          animationDelay: `${i * 0.06}s`,
        }} />
      ))}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 13px',
  background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)',
  borderRadius: 'var(--radius)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '0.86rem',
  outline: 'none', transition: 'border-color 0.15s',
}
