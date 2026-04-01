import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PenLine, Search, X } from 'lucide-react'
import PostCard from '../components/PostCard.jsx'
import { getPosts } from '../utils/api.js'
import { PRESET_TAGS, getTagStyle } from '../utils/tags.js'

export default function Home() {
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTag, setActiveTag] = useState(null)
  const [error, setError]       = useState(null)
  const [query, setQuery]       = useState('')

  useEffect(() => {
    setLoading(true)
    getPosts(activeTag ? { tag: activeTag } : {})
      .then(res => { setPosts(res.data.posts || []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [activeTag])

  const filtered = useMemo(() => {
    if (!query.trim()) return posts
    const q = query.toLowerCase()
    return posts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [posts, query])

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '52px 28px 100px' }}>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ marginBottom: 52, paddingBottom: 44, borderBottom: '1px solid var(--border-muted)' }}
      >
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--accent)', marginBottom: 14,
        }}>
          Tech &amp; DevOps Journal
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'clamp(1.75rem, 4vw, 2.6rem)',
          color: 'var(--text-primary)', lineHeight: 1.15,
          letterSpacing: '-0.02em', marginBottom: 14,
        }}>
          DevSecOps Engineering,<br />
          <span style={{ color: 'var(--accent)' }}>Documented.</span>
        </h1>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.92rem',
          lineHeight: 1.7, maxWidth: 460, marginBottom: 0,
        }}>
          AWS, Kubernetes, Terraform, Lambda and CI/CD pipelines —
          by <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Moses Amartey</span>.
        </p>
      </motion.div>

      {/* Search + filter row */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        style={{ marginBottom: 28 }}
      >
        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: 380, marginBottom: 16 }}>
          <Search size={13} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search posts..."
            style={{
              width: '100%', padding: '8px 36px 8px 34px',
              background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)', fontSize: '0.82rem',
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-muted)'}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', padding: 2,
            }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Tag filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTag(null)}
            className={`tag ${!activeTag ? 'tag-devops' : 'tag-default'}`}
            style={{ cursor: 'pointer', border: '1px solid' }}
          >
            All
          </button>
          {PRESET_TAGS.map(t => {
            const { className } = getTagStyle(t.value)
            const isActive = activeTag === t.value
            return (
              <button
                key={t.value}
                onClick={() => setActiveTag(isActive ? null : t.value)}
                className={`tag ${isActive ? className : 'tag-default'}`}
                style={{ cursor: 'pointer', border: '1px solid' }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Results count when searching */}
      {query && !loading && (
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
          color: 'var(--text-muted)', marginBottom: 16, letterSpacing: '0.04em',
        }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
        </p>
      )}

      {/* Posts grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState error={error} />
      ) : filtered.length === 0 ? (
        <EmptyState tag={activeTag} query={query} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}
        >
          {filtered.map((post, i) => (
            <PostCard key={post._id} post={post} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          height: 170, borderRadius: 'var(--radius-lg)',
          background: `linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%)`,
          backgroundSize: '600px 100%',
          animation: `shimmer 1.6s infinite`,
          animationDelay: `${i * 0.08}s`,
          border: '1px solid var(--border-muted)',
        }} />
      ))}
    </div>
  )
}

function ErrorState({ error }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)', fontSize: '0.82rem' }}>{error}</p>
    </div>
  )
}

function EmptyState({ tag, query }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginBottom: 20, letterSpacing: '0.04em' }}>
        {query ? `No posts matching "${query}".` : tag ? `No posts tagged "${tag}" yet.` : 'No posts yet.'}
      </p>
      {!query && <Link to="/new" className="btn-primary"><PenLine size={12} /> Write the first post</Link>}
    </div>
  )
}
