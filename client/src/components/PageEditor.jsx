import { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { api } from '../api.js'
import { PagesContext } from '../App.jsx'

export default function PageEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { refreshPages } = useContext(PagesContext)
  const [page, setPage] = useState(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('')
  const debounceRef = useRef(null)
  const initializedRef = useRef(false)

  const editor = useCreateBlockNote()

  useEffect(() => {
    initializedRef.current = false
    setLoading(true)
    setSaveStatus('')
    api.getPage(id).then(({ page, blocks }) => {
      setPage(page)
      setTitle(page.title || '')
      if (blocks.length > 0) {
        const parsed = blocks.map(b => JSON.parse(b.content))
        editor.replaceBlocks(editor.document, parsed)
      } else {
        editor.replaceBlocks(editor.document, [{ type: 'paragraph', content: [] }])
      }
      setLoading(false)
      setTimeout(() => { initializedRef.current = true }, 100)
    }).catch(() => {
      setLoading(false)
      navigate('/')
    })
  }, [id])

  const scheduleBlockSave = useCallback(() => {
    if (!initializedRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await api.saveBlocks(id, editor.document)
        setSaveStatus('Saved')
        setTimeout(() => setSaveStatus(''), 2000)
      } catch {
        setSaveStatus('Save failed')
      }
    }, 1000)
  }, [id, editor])

  const handleTitleBlur = async () => {
    if (page && title !== page.title) {
      await api.updatePage(id, { title })
      setPage(p => ({ ...p, title }))
      await refreshPages()
    }
  }

  const createDatabase = async () => {
    const db = await api.createDatabase(id, 'New Database')
    navigate(`/db/${db.id}`)
  }

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>
  if (!page) return <p>Page not found.</p>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        onKeyDown={e => e.key === 'Enter' && e.target.blur()}
        placeholder="Untitled"
        style={{
          fontSize: 36, fontWeight: 700, border: 'none', outline: 'none',
          width: '100%', marginBottom: 16, background: 'transparent',
          fontFamily: 'inherit'
        }}
      />
      <div style={{ minHeight: 400 }}>
        <BlockNoteView
          editor={editor}
          onChange={scheduleBlockSave}
        />
      </div>
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #eee' }}>
        <button
          onClick={createDatabase}
          style={{
            padding: '6px 14px', cursor: 'pointer', border: '1px solid #ddd',
            borderRadius: 6, background: 'none', color: '#555', fontSize: 13
          }}
        >
          + Add database
        </button>
      </div>
      {saveStatus && (
        <p style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>{saveStatus}</p>
      )}
    </div>
  )
}
