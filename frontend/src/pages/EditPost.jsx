import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPost, updatePost } from '../utils/api.js'
import { PRESET_TAGS, getTagStyle } from '../utils/tags.js'

export default function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [title, setTitle]     = useState('')
  const [body, setBody]       = useState('')
  const [author, setAuthor]   = useState('')
  const [tags, setTags]       = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    document.title = 'Edit Post — YormenOps'
    getPost(id)
      .then(res => {
        const p = res.data.post
        setTitle(p.title || '')
        setBody(p.body || '')
        setAuthor(p.authorName || '')
        setTags(p.tags || [])
        setLoading(false)
      })
      .catch(() => { toast.error('Post not found'); navigate('/') })
  }, [id])

  const toggleTag = (tag) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  const readTime  = Math.max(1, Math.ceil(body.split(/\s+/).length / 200))

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) { toast.error('Title and body required'); return }
    setSaving(true)
    try {
      await updatePost(id, { title, body, authorName: author, tags, readTime })
      toast.success('Post updated!')
      navigate(`/post/${id}`)
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.06em' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 28px 80px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              Edit Post
            </h1>
            <div style={{ width: 48, height: 1, background: 'var(--gold)', opacity: 0.55, margin: '10px 0 0' }} />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
            <Save size={11} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', marginBottom: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius)', color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            fontWeight: 400, outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--gold-line)'; e.target.style.boxShadow = '0 0 0 3px var(--gold-glow)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-muted)'; e.target.style.boxShadow = 'none' }}
        />

        <input
          value={author}
          onChange={e => setAuthor(e.target.value)}
          placeholder="Author name"
          style={{
            width: '100%', maxWidth: 280, padding: '8px 12px', marginBottom: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius)', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--gold-line)'; e.target.style.boxShadow = '0 0 0 3px var(--gold-glow)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-muted)'; e.target.style.boxShadow = 'none' }}
        />

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 14 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--gold)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.8 }}>
            Tags
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESET_TAGS.map(t => {
              const { className, label } = getTagStyle(t.value)
              const active = tags.includes(t.value)
              return (
                <button key={t.value} type="button" onClick={() => toggleTag(t.value)}
                  className={`tag ${active ? className : 'tag-default'}`}
                  style={{ cursor: 'pointer', border: '1px solid', opacity: active ? 1 : 0.45, transition: 'opacity 0.15s' }}
                >{label}</button>
              )
            })}
          </div>
        </div>

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          style={{
            width: '100%', minHeight: 500, padding: '18px',
            background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
            lineHeight: 1.75, outline: 'none', resize: 'vertical',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--gold-line)'; e.target.style.boxShadow = '0 0 0 3px var(--gold-glow)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-muted)'; e.target.style.boxShadow = 'none' }}
        />
      </motion.div>
    </div>
  )
}
