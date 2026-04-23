import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PenLine, Search, X } from 'lucide-react'
import PostCard from '../components/PostCard.jsx'
import { getPosts } from '../utils/api.js'
import { PRESET_TAGS, getTagStyle } from '../utils/tags.js'

export default function Home() {
  const [posts, setPosts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTag, setActiveTag] = useState(null)
  const [error, setError]         = useState(null)
  const [query, setQuery]         = useState('')

  useEffect(() => {
    document.title = 'YormenOps — DevOps Journal'
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px 120px' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ marginBottom: 44 }}
      >
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 32, height: 1, background: 'var(--gold)', opacity: 0.6 }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--gold)', opacity: 0.85,
          }}>
            Tech &amp; DevOps Journal
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
          color: 'var(--text-primary)', lineHeight: 1.1,
          letterSpacing: '-0.02em', marginBottom: 4,
        }}>
          DevSecOps Engineering,
        </h1>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 600,
          fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
          color: 'var(--gold)', lineHeight: 1.1,
          letterSpacing: '-0.02em', fontStyle: 'italic',
          marginBottom: 22,
        }}>
          Documented.
        </h1>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.93rem',
          lineHeight: 1.8, maxWidth: 460,
          fontFamily: 'var(--font-body)', fontWeight: 300,
        }}>
          AWS, Kubernetes, Terraform, Lambda and CI/CD pipelines —
          written by{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Moses Amartey</span>.
        </p>
      </motion.div>

      {/* ── Search + Filters ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ marginBottom: 36 }}
      >
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400, marginBottom: 16 }}>
          <Search size={13} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search posts..."
            style={{
              width: '100%', padding: '10px 38px 10px 36px',
              background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)', fontSize: '0.84rem', fontWeight: 300,
              outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--gold-line)'
              e.target.style.boxShadow = '0 0 0 3px var(--gold-glow)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border-muted)'
              e.target.style.boxShadow = 'none'
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
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

      {/* ── Results count ────────────────────────────────────────────────── */}
      {query && !loading && (
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
          color: 'var(--text-muted)', marginBottom: 20, letterSpacing: '0.04em',
        }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* ── Posts grid ───────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState error={error} />
      ) : filtered.length === 0 ? (
        <EmptyState tag={activeTag} query={query} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          height: 200, borderRadius: 'var(--radius-lg)',
          background: `linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%)`,
          backgroundSize: '600px 100%',
          animation: `shimmer 1.8s infinite`,
          animationDelay: `${i * 0.1}s`,
          border: '1px solid var(--border-muted)',
        }} />
      ))}
    </div>
  )
}

function ErrorState({ error }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)', fontSize: '0.8rem', letterSpacing: '0.04em' }}>
        {error}
      </p>
    </div>
  )
}

function EmptyState({ tag, query }) {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '1px solid var(--border-gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
        color: 'var(--gold)', fontFamily: 'var(--font-display)',
        fontSize: '1.2rem', opacity: 0.5,
      }}>✦</div>
      <p style={{
        color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem', marginBottom: 24, letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {query ? `No posts matching "${query}"` : tag ? `No posts tagged "${tag}" yet` : 'No posts yet'}
      </p>
      {!query && (
        <Link to="/new" className="btn-primary">
          <PenLine size={12} /> Write the first post
        </Link>
      )}
    </div>
  )
}
