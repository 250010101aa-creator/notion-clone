import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api.js'

const TYPES = ['text', 'number', 'date', 'checkbox', 'select']

function Cell({ value, type, onChange }) {
  if (type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16, cursor: 'pointer' }}
      />
    )
  }
  if (type === 'date') {
    return (
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontFamily: 'inherit', fontSize: 14 }}
      />
    )
  }
  return (
    <input
      type={type === 'number' ? 'number' : 'text'}
      value={value ?? ''}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontFamily: 'inherit', fontSize: 14 }}
    />
  )
}

export default function DatabaseView() {
  const { id } = useParams()
  const [name, setName] = useState('')
  const [schema, setSchema] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const result = await api.getDatabase(id)
    setName(result.db.name)
    setSchema(JSON.parse(result.db.schema))
    setRows(result.rows.map(r => ({ ...r, data: JSON.parse(r.data) })))
    setLoading(false)
  }

  useEffect(() => { setLoading(true); load() }, [id])

  const addColumn = async () => {
    const colName = prompt('Column name:')
    if (!colName?.trim()) return
    const colType = prompt(`Column type:\n${TYPES.join(', ')}`, 'text')
    if (!TYPES.includes(colType)) return alert(`Invalid type. Choose: ${TYPES.join(', ')}`)
    const newSchema = [...schema, { name: colName.trim(), type: colType }]
    await api.updateDatabase(id, { schema: newSchema })
    setSchema(newSchema)
  }

  const addRow = async () => {
    const data = {}
    schema.forEach(col => { data[col.name] = col.type === 'checkbox' ? false : '' })
    const row = await api.addRow(id, data)
    setRows(r => [...r, { ...row, data }])
  }

  const updateCell = async (rowId, colName, value) => {
    const row = rows.find(r => r.id === rowId)
    const newData = { ...row.data, [colName]: value }
    setRows(rs => rs.map(r => r.id === rowId ? { ...r, data: newData } : r))
    await api.updateRow(id, rowId, newData)
  }

  const deleteRow = async (rowId) => {
    await api.deleteRow(id, rowId)
    setRows(rs => rs.filter(r => r.id !== rowId))
  }

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>

  const cell = {
    padding: '8px 12px',
    borderRight: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0',
    minWidth: 120
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={() => api.updateDatabase(id, { name })}
        onKeyDown={e => e.key === 'Enter' && e.target.blur()}
        style={{
          fontSize: 32, fontWeight: 700, border: 'none', outline: 'none',
          marginBottom: 20, background: 'transparent', width: '100%', fontFamily: 'inherit'
        }}
      />

      {schema.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: 14 }}>No columns yet. Click "+ Add column" to start.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 12 }}>
          <table style={{
            borderCollapse: 'collapse', borderTop: '1px solid #e0e0e0',
            borderLeft: '1px solid #e0e0e0', minWidth: '100%'
          }}>
            <thead>
              <tr style={{ background: '#f4f4f4' }}>
                {schema.map(col => (
                  <th key={col.name} style={{ ...cell, fontWeight: 600, textAlign: 'left', fontSize: 13 }}>
                    {col.name}
                    <span style={{ color: '#bbb', fontWeight: 400, marginLeft: 6 }}>{col.type}</span>
                  </th>
                ))}
                <th style={{ ...cell, width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} style={{ background: '#fff' }}>
                  {schema.map(col => (
                    <td key={col.name} style={cell}>
                      <Cell
                        value={row.data[col.name]}
                        type={col.type}
                        onChange={val => updateCell(row.id, col.name, val)}
                      />
                    </td>
                  ))}
                  <td style={{ ...cell, textAlign: 'center', padding: '4px' }}>
                    <button
                      onClick={() => deleteRow(row.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 14, lineHeight: 1 }}
                      title="Delete row"
                    >✕</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={schema.length + 1} style={{ ...cell, color: '#bbb', fontSize: 13, textAlign: 'center' }}>
                    No rows yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={addRow}
          disabled={schema.length === 0}
          style={{ padding: '6px 14px', cursor: schema.length ? 'pointer' : 'not-allowed', border: '1px solid #ddd', borderRadius: 6, background: 'none', color: '#555', fontSize: 13 }}
        >
          + Add row
        </button>
        <button
          onClick={addColumn}
          style={{ padding: '6px 14px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: 6, background: 'none', color: '#555', fontSize: 13 }}
        >
          + Add column
        </button>
      </div>
    </div>
  )
}
