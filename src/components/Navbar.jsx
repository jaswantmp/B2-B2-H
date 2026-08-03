// src/components/Navbar.jsx
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Code2, Menu, X, Bell } from 'lucide-react'
import logo from '../assets/logo.png'
import PulseAvatar from './PulseAvatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const LINKS = [
  { to: '/dashboard',       label: 'Dashboard' },
  { to: '/discover',        label: 'Discover' },
  { to: '/recommendations', label: 'AI Matches' },
  { to: '/teams',           label: 'Teams' },
  { to: '/hackathons',      label: 'Hackathons' },
]

export default function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <header className="lg:hidden bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-14">
        <Link to="/" className="flex items-center gap-3" aria-label="B2B2H Home">
          <img src={logo} alt="B2B2H Logo" className="w-[40px] h-[40px] object-contain flex-shrink-0" />
          <span className="font-bold text-white text-base">B2B2H</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-slate-200" aria-label="Notifications">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" aria-hidden="true" />
          </Link>
          <PulseAvatar user={user} size="sm" showTooltip={false} />
          <button
            onClick={() => setOpen(o => !o)}
            className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-slate-800 px-4 py-3 space-y-1 bg-slate-900" aria-label="Mobile navigation">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-violet-700/20 text-violet-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
