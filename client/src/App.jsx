import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import PageEditor from './components/PageEditor.jsx'
import DatabaseView from './components/DatabaseView.jsx'
import { api } from './api.js'

export const PagesContext = createContext(null)

export default function App() {
  const [pages, setPages] = useState([])
  const refreshPages = useCallback(async () => setPages(await api.getPages()), [])

  useEffect(() => { refreshPages() }, [])

  return (
    <PagesContext.Provider value={{ pages, refreshPages }}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '40px 60px' }}>
          <Routes>
            <Route path="/" element={<p style={{ color: '#888', fontSize: 15 }}>Select or create a page →</p>} />
            <Route path="/page/:id" element={<PageEditor />} />
            <Route path="/db/:id" element={<DatabaseView />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </PagesContext.Provider>
  )
}
