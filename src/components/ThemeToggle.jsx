// src/components/ThemeToggle.jsx
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`
        relative w-9 h-9 rounded-xl flex items-center justify-center
        transition-all duration-200
        dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700
        bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-200
        border
        ${className}
      `}
    >
      {isDark
        ? <Sun size={16} className="transition-transform duration-200" aria-hidden="true" />
        : <Moon size={16} className="transition-transform duration-200" aria-hidden="true" />
      }
    </button>
  )
}
