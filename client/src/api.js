const BASE = '/api'

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  getPages: () => request('GET', '/pages'),
  createPage: (title, parent_id) => request('POST', '/pages', { title, parent_id }),
  getPage: (id) => request('GET', `/pages/${id}`),
  updatePage: (id, fields) => request('PATCH', `/pages/${id}`, fields),
  deletePage: (id) => request('DELETE', `/pages/${id}`),
  saveBlocks: (pageId, blocks) => request('PUT', `/pages/${pageId}/blocks`, blocks),

  createDatabase: (page_id, name) => request('POST', '/databases', { page_id, name }),
  getDatabase: (id) => request('GET', `/databases/${id}`),
  updateDatabase: (id, fields) => request('PATCH', `/databases/${id}`, fields),
  addRow: (dbId, data) => request('POST', `/databases/${dbId}/rows`, { data }),
  updateRow: (dbId, rowId, data) => request('PATCH', `/databases/${dbId}/rows/${rowId}`, { data }),
  deleteRow: (dbId, rowId) => request('DELETE', `/databases/${dbId}/rows/${rowId}`)
}
