// src/components/Sidebar.jsx
import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Sparkles, UsersRound, FolderOpen,
  Calendar, Bell, Settings, Code2, ChevronRight, ChevronUp, Zap, Hammer, LogOut,
  Lightbulb, UserCheck,
} from 'lucide-react'
import { getNotifications } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import PulseAvatar from './PulseAvatar.jsx'
import AvailabilityIndicator from './AvailabilityIndicator.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const NAV_MAIN = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover',        icon: Users,           label: 'Discover' },
  { to: '/recommendations', icon: Sparkles,        label: 'AI Matches' },
  { to: '/teams',           icon: UsersRound,      label: 'Teams' },
  { to: '/projects',        icon: FolderOpen,      label: 'Projects' },
  { to: '/hackathons',      icon: Calendar,        label: 'Hackathons' },
]

const NAV_TOOLS = [
  { to: '/generator',            icon: Zap,         label: 'AI Team Generator' },
  { to: '/ai-project-generator', icon: Lightbulb,   label: 'AI Idea Generator' },
  { to: '/ai-team-matcher',      icon: UserCheck,   label: 'AI Team Matcher' },
  { to: '/team-builder',         icon: Hammer,      label: 'Team Builder' },
]

const NAV_BOTTOM = [
  { to: '/notifications', icon: Bell,     label: 'Notifications', badge: true },
  { to: '/settings',      icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const [unread, setUnread] = useState(0)
  const { user, logout } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    getNotifications()
      .then(ns => setUnread(ns.filter(n => !n.read).length))
      .catch(console.error)
  }, [user])


  const navLink = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 text-sm font-medium theme-nav-item ${isActive ? 'active' : ''}`

  const handleLogout = () => {
    logout()
    push('Logout successful. See you soon!', 'success')
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-screen sticky top-0 border-r theme-divider z-30"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Logo + theme toggle */}
      <div className="px-4 py-4 border-b theme-divider flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="B2B2H Home">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center group-hover:bg-violet-500 transition-colors">
            <Code2 size={17} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight theme-text block leading-none">B2B2H</span>
            <span className="text-xs theme-muted leading-none">Born 2 Build</span>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        <p className="text-xs font-semibold theme-muted uppercase tracking-wider px-3 mb-2">Platform</p>
        {NAV_MAIN.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={navLink}>
            <Icon size={17} aria-hidden="true" />
            {label}
          </NavLink>
        ))}

        <div className="pt-3">
          <p className="text-xs font-semibold theme-muted uppercase tracking-wider px-3 mb-2">AI Tools</p>
          {NAV_TOOLS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={navLink}>
              <Icon size={17} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-3 border-t theme-divider space-y-1">
        {NAV_BOTTOM.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} className={navLink}>
            <Icon size={17} aria-hidden="true" />
            {label}
            {badge && unread > 0 && (
              <span className="ml-auto text-xs bg-violet-600 text-white rounded-full w-5 h-5 flex items-center justify-center leading-none">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* User footer with logout menu */}
      <div className="px-3 pb-4 relative">
        {menuOpen && (
          <div
            className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
            role="menu"
          >
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm theme-text-secondary hover:theme-text transition-colors"
              style={{}}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Settings size={15} /> Settings
            </Link>
            <button
              onClick={handleLogout}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 transition-colors"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}

        <button
          onClick={() => setMenuOpen(o => !o)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border theme-divider hover:border-violet-500/40 transition-all group"
          style={{ backgroundColor: 'var(--bg-raised)' }}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Account menu"
        >
          <PulseAvatar user={user} size="sm" showTooltip={false} />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium theme-text truncate">{user.name}</p>
            <AvailabilityIndicator status={user.status} showLabel={false} />
          </div>
          {menuOpen
            ? <ChevronUp size={14} className="text-violet-400 transition-colors flex-shrink-0" aria-hidden="true" />
            : <ChevronRight size={14} className="theme-muted group-hover:text-violet-400 transition-colors flex-shrink-0" aria-hidden="true" />
          }
        </button>
      </div>
    </aside>
  )
}
