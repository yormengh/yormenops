import { Component } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout     from './components/Layout.jsx'
import Home       from './pages/Home.jsx'
import PostDetail from './pages/PostDetail.jsx'
import NewPost    from './pages/NewPost.jsx'
import EditPost   from './pages/EditPost.jsx'
import TagFeed    from './pages/TagFeed.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)', padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '1px solid var(--border-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)', fontFamily: 'var(--font-display)',
            fontSize: '1.4rem', marginBottom: 24, opacity: 0.6,
          }}>✦</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: '1.6rem', color: 'var(--text-primary)',
            marginBottom: 12, letterSpacing: '-0.01em',
          }}>
            Something went wrong
          </h2>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
            color: 'var(--text-muted)', letterSpacing: '0.04em',
            marginBottom: 28,
          }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="btn-ghost"
          >
            Return to journal
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/"         element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/new"      element={<NewPost />} />
          <Route path="/edit/:id" element={<EditPost />} />
          <Route path="/tag/:tag" element={<TagFeed />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}
