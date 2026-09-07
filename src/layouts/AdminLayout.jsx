// src/layouts/AdminLayout.jsx
import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, FolderOpen, UsersRound,
  BarChart3, ArrowLeft, ShieldCheck, Menu, X, LogOut,
} from 'lucide-react'
import logo from '../assets/logo.png'
import ThemeToggle from '../components/ThemeToggle.jsx'
import PulseAvatar from '../components/PulseAvatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const ADMIN_NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', enabled: true },
  { to: '/admin/students', icon: Users, label: 'Students', enabled: true },
  { to: '/admin/hackathons', icon: Calendar, label: 'Hackathons', enabled: true },
  { to: '/admin/projects', icon: FolderOpen, label: 'Projects', enabled: true },
  { to: '/admin/teams', icon: UsersRound, label: 'Teams', enabled: true },
  { to: '/admin/statistics', icon: BarChart3, label: 'Statistics', enabled: true },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    push('Logged out successfully.', 'success')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row theme-bg theme-text">
      {/* Mobile Topbar */}
      <header
        className="lg:hidden sticky top-0 z-40 border-b theme-divider flex items-center justify-between px-4 h-14"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="B2B2H" className="w-8 h-8 object-contain" />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm theme-text">B2B2H</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-2 theme-muted hover:theme-text transition-colors"
            aria-label="Toggle admin navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-b theme-divider px-4 py-3 space-y-1.5 z-30"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {ADMIN_NAV_ITEMS.map(({ to, icon: Icon, label, enabled }) => (
            enabled ? (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'theme-text-secondary hover:theme-text hover:bg-[var(--bg-raised)]'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ) : (
              <div
                key={to}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-75"
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} />
                  {label}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Phase 2
                </span>
              </div>
            )
          ))}

          <div className="pt-2 mt-2 border-t theme-divider space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Student View
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex w-64 flex-col h-screen sticky top-0 border-r theme-divider z-30"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header Branding */}
        <div className="p-4 border-b theme-divider flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3 group">
            <img src={logo} alt="B2B2H Logo" className="w-9 h-9 object-contain" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight theme-text">B2B2H</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  Admin
                </span>
              </div>
              <span className="text-xs theme-muted flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} className="text-amber-600 dark:text-amber-400" />
                Control Center
              </span>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin Navigation">
          <p className="text-xs font-semibold theme-muted uppercase tracking-wider px-3 mb-2">
            Management
          </p>
          {ADMIN_NAV_ITEMS.map(({ to, icon: Icon, label, enabled }) => (
            enabled ? (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : 'theme-text-secondary hover:theme-text hover:bg-[var(--bg-raised)]'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ) : (
              <div
                key={to}
                title="Coming in Phase 2"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed select-none opacity-80"
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {label}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Phase 2
                </span>
              </div>
            )
          ))}
        </nav>

        {/* Bottom Actions: Back to Student View & User Bar */}
        <div className="p-3 border-t theme-divider space-y-2">
          <Link
            to="/dashboard"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors border border-violet-200 dark:border-violet-800/40"
          >
            <ArrowLeft size={16} />
            Back to Student View
          </Link>

          <div
            className="flex items-center justify-between p-2.5 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <PulseAvatar user={user} size="sm" showTooltip={false} />
              <div className="min-w-0">
                <p className="text-xs font-bold theme-text truncate">{user?.name}</p>
                <p className="text-[10px] theme-muted truncate">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
