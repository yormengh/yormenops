import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getPosts } from '../utils/api.js'
import PostCard from '../components/PostCard.jsx'
import { getTagStyle } from '../utils/tags.js'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TagFeed() {
  const { tag }  = useParams()
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const { className, label } = getTagStyle(tag)

  useEffect(() => {
    setLoading(true)
    getPosts({ tag }).then(res => { setPosts(res.data.posts || []); setLoading(false) })
  }, [tag])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Link to="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 36,
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={13} /> Back to feed
      </Link>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 32, height: 1, background: 'var(--gold)', opacity: 0.6 }} />
          <span className={`tag ${className}`} style={{ fontSize: '0.62rem', padding: '3px 10px' }}>{label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 400,
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          color: 'var(--text-primary)', letterSpacing: '-0.01em',
          fontStyle: 'italic', lineHeight: 1.1,
        }}>
          #{tag}
        </h1>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>No posts with this tag yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
        </div>
      )}
    </div>
  )
}
