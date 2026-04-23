import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Clock, MessageSquare, BookOpen } from 'lucide-react'
import { getTagStyle, REACTIONS } from '../utils/tags.js'

export default function PostCard({ post, index = 0 }) {
  const totalReactions = REACTIONS.reduce((sum, r) => sum + (post.reactions?.[r.key] || 0), 0)

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link to={`/post/${post._id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div className="card" style={{
          padding: '32px 32px 28px',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Subtle top gold line */}
          <div style={{
            position: 'absolute', top: 0, left: 28, right: 28, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--gold-line), transparent)',
            opacity: 0,
            transition: 'opacity 0.3s',
          }} className="card-top-line" />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
              {post.tags.slice(0, 3).map(tag => {
                const { className, label } = getTagStyle(tag)
                return <span key={tag} className={`tag ${className}`}>{label}</span>
              })}
            </div>
          )}

          {/* Title */}
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 600,
            fontSize: '1.28rem', lineHeight: 1.35,
            color: 'var(--text-primary)', marginBottom: 10,
            letterSpacing: '-0.01em',
          }}>
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p style={{
              color: 'var(--text-secondary)', fontSize: '0.83rem',
              lineHeight: 1.7, marginBottom: 20,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              fontFamily: 'var(--font-body)', fontWeight: 300,
            }}>
              {post.excerpt}
            </p>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 8, paddingTop: 16,
            borderTop: '1px solid var(--border-muted)',
          }}>
            {/* Author + date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Monogram */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                border: '1px solid var(--gold-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', fontWeight: 600, color: 'var(--gold)',
                fontFamily: 'var(--font-display)', flexShrink: 0,
                background: 'var(--gold-glow)',
              }}>
                {(post.authorName || 'MA').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                  fontWeight: 500, color: 'var(--text-primary)',
                }}>
                  {post.authorName || 'Moses Amartey'}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                  color: 'var(--text-muted)', marginTop: 1,
                }}>
                  <Clock size={8} />
                  {post.createdAt && !isNaN(new Date(post.createdAt))
                    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                    : 'recently'}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {post.readTime && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                }}>
                  <BookOpen size={9} />{post.readTime} min
                </span>
              )}
              {post.commentCount > 0 && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                }}>
                  <MessageSquare size={9} />{post.commentCount}
                </span>
              )}
              {totalReactions > 0 && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                  color: 'var(--gold)', opacity: 0.7,
                }}>
                  ✦ {totalReactions}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <style>{`
        article:hover .card-top-line { opacity: 1 !important; }
      `}</style>
    </motion.article>
  )
}
