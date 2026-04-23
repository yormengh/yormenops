import Navbar from './Navbar.jsx'

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: 62 }}>{children}</main>
      <footer style={{
        padding: '36px 32px',
        borderTop: '1px solid var(--border-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        flexWrap: 'wrap',
      }}>
        {/* Gold rule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 24, height: 1, background: 'var(--gold)', opacity: 0.4 }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            Moses Amartey · YormenOps · {new Date().getFullYear()}
          </span>
          <div style={{ width: 24, height: 1, background: 'var(--gold)', opacity: 0.4 }} />
        </div>
      </footer>
    </div>
  )
}
