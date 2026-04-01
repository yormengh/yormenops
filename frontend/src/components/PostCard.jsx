import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Clock, MessageSquare, BookOpen } from 'lucide-react'
import { getTagStyle, REACTIONS } from '../utils/tags.js'

const TAG_ACCENT = {
  devops: '#c9a84c', aws: '#e8956d', k8s: '#6b9fd4', kubernetes: '#6b9fd4',
  terraform: '#a78bfa', linux: '#4caf7d', cicd: '#e879a0',
  docker: '#6b9fd4', security: '#e8956d', lambda: '#e8956d', mongodb: '#4caf7d',
}

export default function PostCard({ post, index = 0 }) {
  const totalReactions = REACTIONS.reduce((sum, r) => sum + (post.reactions?.[r.key] || 0), 0)
  const accentColor = TAG_ACCENT[post.tags?.[0]?.toLowerCase()] || 'var(--accent)'

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Link to={`/post/${post._id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div className="card" style={{
          padding: '20px 22px',
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: 'var(--radius-lg)',
        }}>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
              {post.tags.slice(0, 3).map(tag => {
                const { className, label } = getTagStyle(tag)
                return <span key={tag} className={`tag ${className}`}>{label}</span>
              })}
            </div>
          )}

          {/* Title */}
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 600,
            fontSize: '1.02rem', lineHeight: 1.42,
            color: 'var(--text-primary)', marginBottom: 8,
          }}>
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p style={{
              color: 'var(--text-secondary)', fontSize: '0.82rem',
              lineHeight: 1.65, marginBottom: 16,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              fontFamily: 'var(--font-body)',
            }}>
              {post.excerpt}
            </p>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 8, paddingTop: 12,
            borderTop: '1px solid var(--border-muted)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.58rem', fontWeight: 700, color: '#0a0a0a',
                fontFamily: 'var(--font-mono)', flexShrink: 0,
              }}>
                {(post.authorName || 'MA').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {post.authorName || 'Moses Amartey'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  <Clock size={9} />
                  {post.createdAt && !isNaN(new Date(post.createdAt))
                    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                    : 'recently'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {post.readTime && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  <BookOpen size={9} />{post.readTime} min read
                </span>
              )}
              {post.commentCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  <MessageSquare size={9} />{post.commentCount}
                </span>
              )}
              {totalReactions > 0 && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  ⚡ {totalReactions}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
