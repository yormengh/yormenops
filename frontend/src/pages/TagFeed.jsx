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
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 32 }}>
        <ArrowLeft size={13} /> Back to feed
      </Link>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <span className={`tag ${className}`} style={{ fontSize: '0.8rem', padding: '6px 16px' }}>{label}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }}>{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          #{tag} posts
        </h1>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>No posts with this tag yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
        </div>
      )}
    </div>
  )
}
