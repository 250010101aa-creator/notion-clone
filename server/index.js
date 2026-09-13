const express = require('express')
const cors = require('cors')
require('./db')
const pagesRouter = require('./routes/pages')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/pages', pagesRouter)
app.get('/api/health', (req, res) => res.json({ ok: true }))

app.listen(3001, () => console.log('Server running on http://localhost:3001'))
