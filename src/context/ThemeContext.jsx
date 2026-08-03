// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Check localStorage
    const stored = localStorage.getItem('b2b2h-theme')
    if (stored === 'light' || stored === 'dark') return stored
    // 2. Fall back to system preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    // Apply/remove class for Tailwind dark: selector
    root.classList.toggle('dark', theme === 'dark')
    root.setAttribute('data-theme', theme)
    localStorage.setItem('b2b2h-theme', theme)
  }, [theme])

  // Listen for system preference changes when no localStorage value exists
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      if (!localStorage.getItem('b2b2h-theme')) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])
  const isDark = theme === 'dark'

  const value = useMemo(() => ({
    theme,
    isDark,
    toggle,
    setTheme,
  }), [theme, isDark, toggle])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
