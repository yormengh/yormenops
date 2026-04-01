import Navbar from './Navbar.jsx'

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: 58 }}>{children}</main>
      <footer style={{
        padding: '28px 24px',
        borderTop: '1px solid var(--border-muted)',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        Moses Amartey · YormenOps · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
