const { Router } = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

const router = Router()

// POST /api/databases
router.post('/', (req, res) => {
  try {
    const { page_id, name = 'Untitled Database' } = req.body
    const id = uuidv4()
    db.prepare('INSERT INTO databases (id, page_id, name, schema) VALUES (?, ?, ?, ?)').run(id, page_id, name, '[]')
    res.json(db.prepare('SELECT * FROM databases WHERE id = ?').get(id))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/databases/:id
router.get('/:id', (req, res) => {
  try {
    const database = db.prepare('SELECT * FROM databases WHERE id = ?').get(req.params.id)
    if (!database) return res.status(404).json({ error: 'Not found' })
    const rows = db.prepare('SELECT * FROM database_rows WHERE database_id = ? ORDER BY position ASC').all(req.params.id)
    res.json({ db: database, rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/databases/:id
router.patch('/:id', (req, res) => {
  try {
    const database = db.prepare('SELECT * FROM databases WHERE id = ?').get(req.params.id)
    if (!database) return res.status(404).json({ error: 'Not found' })
    const name = req.body.name ?? database.name
    const schema = req.body.schema !== undefined ? JSON.stringify(req.body.schema) : database.schema
    db.prepare('UPDATE databases SET name = ?, schema = ? WHERE id = ?').run(name, schema, req.params.id)
    res.json(db.prepare('SELECT * FROM databases WHERE id = ?').get(req.params.id))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/databases/:id/rows
router.post('/:id/rows', (req, res) => {
  try {
    const { data = {} } = req.body
    const id = uuidv4()
    const count = db.prepare('SELECT COUNT(*) as c FROM database_rows WHERE database_id = ?').get(req.params.id).c
    db.prepare('INSERT INTO database_rows (id, database_id, data, position) VALUES (?, ?, ?, ?)').run(id, req.params.id, JSON.stringify(data), count)
    res.json(db.prepare('SELECT * FROM database_rows WHERE id = ?').get(id))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/databases/:id/rows/:rowId
router.patch('/:id/rows/:rowId', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM database_rows WHERE id = ?').get(req.params.rowId)
    if (!row) return res.status(404).json({ error: 'Not found' })
    db.prepare('UPDATE database_rows SET data = ? WHERE id = ?').run(JSON.stringify(req.body.data), req.params.rowId)
    res.json(db.prepare('SELECT * FROM database_rows WHERE id = ?').get(req.params.rowId))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/databases/:id/rows/:rowId
router.delete('/:id/rows/:rowId', (req, res) => {
  try {
    db.prepare('DELETE FROM database_rows WHERE id = ?').run(req.params.rowId)
    res.sendStatus(204)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
