const { Router } = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

const router = Router()

function buildTree(pages) {
  const map = {}
  const roots = []
  pages.forEach(p => { map[p.id] = { ...p, children: [] } })
  pages.forEach(p => {
    if (p.parent_id && map[p.parent_id]) {
      map[p.parent_id].children.push(map[p.id])
    } else {
      roots.push(map[p.id])
    }
  })
  return roots
}

// GET /api/pages
router.get('/', (req, res) => {
  try {
    const pages = db.prepare('SELECT * FROM pages ORDER BY created_at ASC').all()
    res.json(buildTree(pages))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/pages
router.post('/', (req, res) => {
  try {
    const { title = 'Untitled', parent_id = null } = req.body
    const id = uuidv4()
    const now = Date.now()
    db.prepare(
      'INSERT INTO pages (id, title, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, title, parent_id, now, now)
    res.json(db.prepare('SELECT * FROM pages WHERE id = ?').get(id))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/pages/:id
router.get('/:id', (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id)
    if (!page) return res.status(404).json({ error: 'Not found' })
    const blocks = db.prepare('SELECT * FROM blocks WHERE page_id = ? ORDER BY position ASC').all(req.params.id)
    res.json({ page, blocks })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/pages/:id
router.patch('/:id', (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id)
    if (!page) return res.status(404).json({ error: 'Not found' })
    const { title = page.title, icon = page.icon, cover = page.cover } = req.body
    db.prepare(
      'UPDATE pages SET title = ?, icon = ?, cover = ?, updated_at = ? WHERE id = ?'
    ).run(title, icon, cover, Date.now(), req.params.id)
    res.json(db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/pages/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id)
    res.sendStatus(204)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/pages/:id/blocks
router.put('/:id/blocks', (req, res) => {
  try {
    const blocks = req.body
    const now = Date.now()
    const deleteBlocks = db.prepare('DELETE FROM blocks WHERE page_id = ?')
    const insertBlock = db.prepare(
      'INSERT INTO blocks (id, page_id, type, content, position, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const saveAll = db.transaction((pageId, bArr) => {
      deleteBlocks.run(pageId)
      bArr.forEach((b, i) => {
        insertBlock.run(b.id || uuidv4(), pageId, b.type, JSON.stringify(b), i, now)
      })
      db.prepare('UPDATE pages SET updated_at = ? WHERE id = ?').run(now, pageId)
    })
    saveAll(req.params.id, blocks)
    res.sendStatus(200)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
