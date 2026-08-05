// src/components/AppNavbar.jsx
import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Code2, Menu, X, Bell, LogOut, Settings } from 'lucide-react'
import logo from '../assets/logo.png'
import PulseAvatar from './PulseAvatar.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { getNotifications } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const LINKS = [
  { to: '/dashboard',            label: 'Dashboard' },
  { to: '/discover',             label: 'Discover' },
  { to: '/recommendations',      label: 'AI Matches' },
  { to: '/teams',                label: 'Teams' },
  { to: '/hackathons',           label: 'Hackathons' },
  { to: '/projects',             label: 'Projects' },
  { to: '/generator',            label: 'AI Team Generator' },
  { to: '/ai-project-generator', label: 'AI Idea Generator' },
  { to: '/ai-team-matcher',      label: 'AI Team Matcher' },
]

export default function AppNavbar() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const { user, logout } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.id) return
    getNotifications()
      .then(ns => setUnread(ns.filter(n => !n.read).length))
      .catch(err => console.warn('AppNavbar notifications error:', err))
  }, [user])


  const handleLogout = () => {
    setOpen(false)
    logout()
    push('Logout successful. See you soon!', 'success')
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <header
      className="lg:hidden sticky top-0 z-40 border-b theme-divider"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="flex items-center justify-between px-4 h-14 gap-3">
        <Link to="/" className="flex items-center gap-3 flex-shrink-0" aria-label="B2B2H Home">
          <img src={logo} alt="B2B2H Logo" className="w-[40px] h-[40px] object-contain flex-shrink-0" />
          <span className="font-bold text-base theme-text">B2B2H</span>
        </Link>

        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <Link
            to="/notifications"
            className="relative p-2 theme-muted hover:text-violet-400 transition-colors"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          >
            <Bell size={19} />
            {unread > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full"
                aria-hidden="true"
              />
            )}
          </Link>
          <PulseAvatar user={user} size="sm" showTooltip={false} />
          <button
            onClick={() => setOpen(o => !o)}
            className="p-2 theme-muted transition-colors"
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t theme-divider px-4 py-3 space-y-1"
          style={{ backgroundColor: 'var(--bg-surface)' }}
          aria-label="Mobile navigation"
        >
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-xl text-sm font-medium transition-all theme-nav-item ${isActive ? 'active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}

          <div className="pt-2 mt-2 border-t theme-divider space-y-1">
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all theme-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Settings size={16} /> Settings
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/10 transition-all"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
