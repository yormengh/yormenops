import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => setMobileOpen(false), [location])

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 58,
      background: scrolled ? 'rgba(10,10,10,0.96)' : 'var(--bg)',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: `1px solid ${scrolled ? 'var(--border-muted)' : 'transparent'}`,
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      <div style={{
        maxWidth: 1080, margin: '0 auto', padding: '0 28px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem',
            color: 'var(--text-primary)', letterSpacing: '-0.01em',
          }}>
            Yormen<span style={{ color: 'var(--accent)' }}>Ops</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desk-nav">
          <NavLink to="/"    label="Feed"      active={location.pathname === '/'} />
          <NavLink to="/new" label="Write"     active={location.pathname === '/new'} />
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="mob-btn"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, display: 'none' }}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            style={{
              background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-muted)',
              padding: '12px 28px', display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            <Link to="/"    style={mobStyle}>Feed</Link>
            <Link to="/new" style={{ ...mobStyle, color: 'var(--accent)' }}>Write a post</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 600px) { .desk-nav { display: none !important; } .mob-btn { display: flex !important; } }
      `}</style>
    </header>
  )
}

function NavLink({ to, label, active }) {
  return (
    <Link to={to} style={{
      padding: '5px 12px', borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
      letterSpacing: '0.04em', textTransform: 'uppercase',
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      textDecoration: 'none', transition: 'color 0.15s ease',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
    >
      {label}
    </Link>
  )
}

const mobStyle = {
  fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.04em',
  color: 'var(--text-secondary)', textDecoration: 'none',
  padding: '10px 0', borderBottom: '1px solid var(--border-muted)',
}
