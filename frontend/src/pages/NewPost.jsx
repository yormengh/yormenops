import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Send, X, Plus, Eye, Edit3, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import { createPost } from '../utils/api.js'
import { PRESET_TAGS, getTagStyle } from '../utils/tags.js'

const PLACEHOLDER = `## What did you build or learn today?

Write in **Markdown** — headers, lists, code blocks, tables all render perfectly.

### Example: Deploying with Helm

\`\`\`bash
helm upgrade --install my-app ./charts/app \\
  --namespace production \\
  --set image.tag=v1.2.3 \\
  --set replicaCount=3
\`\`\`

### Key takeaways

- Always pin your image tags in production
- Use \`--atomic\` for rollback on failure
- Monitor your rollout with \`kubectl rollout status\`

> Pro tip: Use \`helm diff\` plugin to preview changes before applying.
`

export default function NewPost() {
  const navigate = useNavigate()
  const [title, setTitle]         = useState('')
  const [body, setBody]           = useState(PLACEHOLDER)
  const [author, setAuthor]       = useState('Moses Amartey')
  const [tags, setTags]           = useState([])
  const [customTag, setCustomTag] = useState('')
  const [preview, setPreview]     = useState(false)
  const [saving, setSaving]       = useState(false)

  useEffect(() => { document.title = 'New Post — YormenOps' }, [])

  const toggleTag = (tag) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setCustomTag('') }
  }

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t))
  const readTime  = Math.max(1, Math.ceil(body.split(/\s+/).length / 200))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!body.trim())  { toast.error('Post body is required'); return }
    setSaving(true)
    try {
      const res = await createPost({ title, body, authorName: author, tags, readTime })
      toast.success('Post published!')
      navigate(`/post/${res.data.post._id}`)
    } catch (err) {
      toast.error(err.message || 'Publish failed')
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 28px 80px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              New Post
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.04em' }}>
              ~{readTime} min read · {body.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPreview(!preview)} className="btn-ghost">
              {preview ? <><Edit3 size={11} /> Edit</> : <><Eye size={11} /> Preview</>}
            </button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
              <Send size={11} /> {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Post title"
            style={{
              width: '100%', padding: '12px 16px', marginBottom: 14,
              background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)', fontSize: '1.1rem',
              fontWeight: 600, outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-muted)'}
          />

          {/* Author */}
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="Author name"
            style={{
              width: '100%', maxWidth: 280, padding: '8px 12px', marginBottom: 14,
              background: 'var(--bg-card)', border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius)', color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', fontSize: '0.78rem', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-muted)'}
          />

          {/* Tags */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 14 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Tags
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
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
              {tags.filter(t => !PRESET_TAGS.map(p => p.value).includes(t)).map(t => (
                <span key={t} className="tag tag-default" style={{ cursor: 'pointer' }} onClick={() => removeTag(t)}>
                  {t} <X size={9} />
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                placeholder="Custom tag..."
                style={{
                  flex: 1, padding: '6px 10px',
                  background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)', fontSize: '0.72rem', outline: 'none',
                }}
              />
              <button type="button" onClick={addCustomTag} className="btn-ghost" style={{ padding: '6px 10px' }}>
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Editor / Preview */}
          {preview ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '28px 32px', minHeight: 480 }}
            >
              <MarkdownPreview body={body} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                <Lightbulb size={10} style={{ color: 'var(--accent)' }} />
                Markdown supported — code blocks, tables, headers, bold, links
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
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-muted)'}
              />
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  )
}

function MarkdownPreview({ body }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter language={match[1]} style={vscDarkPlus}
              customStyle={{ borderRadius: 6, fontSize: '0.83rem', background: '#0d1117', marginBottom: '1.2rem' }}
              showLineNumbers {...props}
            >{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
          ) : (
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.83em', background: 'rgba(201,168,76,0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 3 }} {...props}>{children}</code>
          )
        },
        h1: ({ children }) => <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.7rem', color: 'var(--text-primary)', margin: '1.8rem 0 0.9rem', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.5rem' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.3rem', color: 'var(--text-primary)', margin: '1.5rem 0 0.7rem' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--accent)', margin: '1.2rem 0 0.5rem' }}>{children}</h3>,
        p:  ({ children }) => <p  style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem', fontSize: '0.93rem' }}>{children}</p>,
        ul: ({ children }) => <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.4rem', marginBottom: '1rem', lineHeight: 1.9 }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ color: 'var(--text-secondary)', paddingLeft: '1.4rem', marginBottom: '1rem', lineHeight: 1.9 }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
        blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '1rem', margin: '1.2rem 0', color: 'var(--text-muted)', fontStyle: 'italic' }}>{children}</blockquote>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{children}</a>,
        strong: ({ children }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>,
      }}
    >{body}</ReactMarkdown>
  )
}
