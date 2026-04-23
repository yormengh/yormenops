import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, PenLine } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => setMobileOpen(false), [location])

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 62,
      background: scrolled ? 'rgba(14,14,18,0.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: `1px solid ${scrolled ? 'var(--border-muted)' : 'transparent'}`,
      transition: 'background 0.35s, border-color 0.35s, backdrop-filter 0.35s',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 32px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Monogram mark */}
          <div style={{
            width: 28, height: 28,
            border: '1px solid var(--gold-line)',
            borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 600,
              fontSize: '0.85rem', color: 'var(--gold)', lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>Y</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 500,
            fontSize: '1.1rem', letterSpacing: '0.01em',
            color: 'var(--text-primary)',
          }}>
            Yormen<span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Ops</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="desk-nav">
          <NavLink to="/"    label="Journal"  active={location.pathname === '/'} />
          <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 6px' }} />
          <Link to="/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px',
            background: 'transparent',
            border: '1px solid var(--gold-line)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
            fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase',
            color: 'var(--gold)', textDecoration: 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--gold-glow)'
              e.currentTarget.style.boxShadow = '0 0 16px rgba(197,160,80,0.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <PenLine size={11} /> Write
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="mob-btn"
          aria-label="Toggle menu"
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            padding: 6, display: 'none',
          }}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border-muted)',
              padding: '16px 32px 20px',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}
          >
            <Link to="/"    style={mobLinkStyle}>Journal</Link>
            <Link to="/new" style={{ ...mobLinkStyle, color: 'var(--gold)' }}>Write a post</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 600px) {
          .desk-nav { display: none !important; }
          .mob-btn  { display: flex !important; }
        }
      `}</style>
    </header>
  )
}

function NavLink({ to, label, active }) {
  return (
    <Link to={to} style={{
      padding: '5px 14px',
      fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
      letterSpacing: '0.09em', textTransform: 'uppercase',
      color: active ? 'var(--gold)' : 'var(--text-secondary)',
      textDecoration: 'none', transition: 'color 0.2s ease',
      borderRadius: 'var(--radius-sm)',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
    >
      {label}
    </Link>
  )
}

const mobLinkStyle = {
  fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: 'var(--text-secondary)', textDecoration: 'none',
  padding: '12px 0', borderBottom: '1px solid var(--border-muted)',
}
