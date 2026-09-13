import { useState, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PagesContext, ThemeContext } from '../App.jsx'
import { api } from '../api.js'

function PageNode({ page, depth = 0 }) {
  const { refreshPages } = useContext(PagesContext)
  const navigate = useNavigate()
  const { id } = useParams()
  const [open, setOpen] = useState(false)
  const active = id === page.id

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', padding: '3px 8px',
          paddingLeft: 8 + depth * 16,
          background: active ? 'var(--active-bg)' : 'transparent',
          borderRadius: 4, cursor: 'pointer', userSelect: 'none'
        }}
      >
        {page.children?.length > 0 && (
          <span onClick={() => setOpen(o => !o)} style={{ marginRight: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            {open ? '▼' : '▶'}
          </span>
        )}
        {!page.children?.length && <span style={{ width: 14 }} />}
        <span
          style={{ flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}
          onClick={() => navigate(`/page/${page.id}`)}
        >
          {page.icon ? `${page.icon} ` : '📄 '}{page.title || 'Untitled'}
        </span>
        <span
          onClick={async (e) => {
            e.stopPropagation()
            await api.deletePage(page.id)
            await refreshPages()
            navigate('/')
          }}
          style={{ opacity: 0, fontSize: 12, marginLeft: 4, lineHeight: 1, color: 'var(--text-muted)' }}
          className="delete-btn"
          title="Delete"
        >✕</span>
      </div>
      {open && page.children?.map(child => (
        <PageNode key={child.id} page={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function Sidebar() {
  const { pages, refreshPages } = useContext(PagesContext)
  const { dark, toggle } = useContext(ThemeContext)
  const navigate = useNavigate()

  const newPage = async () => {
    const page = await api.createPage('Untitled')
    await refreshPages()
    navigate(`/page/${page.id}`)
  }

  return (
    <aside style={{
      width: 240, borderRight: `1px solid var(--border)`, display: 'flex',
      flexDirection: 'column', padding: '16px 0', overflowY: 'auto',
      background: 'var(--sidebar-bg)', flexShrink: 0
    }}>
      <div style={{ padding: '0 12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>📝 My Notion</span>
        <button
          onClick={toggle}
          title={dark ? 'Светлая тема' : 'Тёмная тема'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, lineHeight: 1, padding: '2px 4px', color: 'var(--text-muted)'
          }}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
      <div style={{ flex: 1 }}>
        {pages.map(p => <PageNode key={p.id} page={p} />)}
        {pages.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-faint)', padding: '0 12px' }}>No pages yet</p>
        )}
      </div>
      <button
        onClick={newPage}
        style={{
          margin: '12px', padding: '8px', border: `1px dashed var(--btn-border)`,
          borderRadius: 6, background: 'none', cursor: 'pointer', color: 'var(--btn-color)', fontSize: 14
        }}
      >
        + New page
      </button>
    </aside>
  )
}
