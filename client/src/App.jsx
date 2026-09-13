import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import PageEditor from './components/PageEditor.jsx'
import DatabaseView from './components/DatabaseView.jsx'
import { api } from './api.js'

export const PagesContext = createContext(null)
export const ThemeContext = createContext(null)

export default function App() {
  const [pages, setPages] = useState([])
  const refreshPages = useCallback(async () => setPages(await api.getPages()), [])

  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => { refreshPages() }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      <PagesContext.Provider value={{ pages, refreshPages }}>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
          <Sidebar />
          <main style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', background: 'var(--bg)', color: 'var(--text)' }}>
            <Routes>
              <Route path="/" element={<p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Select or create a page →</p>} />
              <Route path="/page/:id" element={<PageEditor />} />
              <Route path="/db/:id" element={<DatabaseView />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </PagesContext.Provider>
    </ThemeContext.Provider>
  )
}
