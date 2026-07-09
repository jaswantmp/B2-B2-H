// src/pages/HackathonsPage.jsx
import { useState, useEffect } from 'react'
import {
  Calendar, MapPin, Users, Trophy, Search, Tag,
  CheckCircle, Clock, ExternalLink, Filter,
} from 'lucide-react'
import { getHackathons, registerHackathon } from '../services/api.js'
import { useTheme } from '../context/ThemeContext.jsx'


function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(d) {
  const diff = Math.ceil((new Date(d) - Date.now()) / 86400000)
  if (diff < 0) return 'Ended'
  if (diff === 0) return 'Today'
  return `${diff}d left`
}

const TAG_COLORS = {
  AI: 'bg-violet-900/50 border-violet-700/60 text-violet-300',
  Web3: 'bg-cyan-900/50 border-cyan-700/60 text-cyan-300',
  Blockchain: 'bg-blue-900/50 border-blue-700/60 text-blue-300',
  Global: 'bg-emerald-900/50 border-emerald-700/60 text-emerald-300',
  Government: 'bg-amber-900/50 border-amber-700/60 text-amber-300',
  MLH: 'bg-pink-900/50 border-pink-700/60 text-pink-300',
}

function tagClass(tag) {
  return TAG_COLORS[tag] ?? 'bg-slate-800/80 border-slate-700 text-slate-400'
}

function HackathonCard({ h, isDark, onToggleRegister }) {
  const [registered, setRegistered] = useState(h.userRegistered)
  const [loading, setLoading] = useState(false)
  const urgency = daysUntil(h.date)
  const urgent = !isNaN(parseInt(urgency)) && parseInt(urgency) <= 7

  const card = isDark
    ? `bg-slate-800/50 border-slate-700/50 hover:border-violet-700/50`
    : `bg-white border-slate-200 hover:border-violet-400/60`

  const muted = isDark ? 'text-slate-400' : 'text-slate-500'
  const sub = isDark ? 'text-slate-300' : 'text-slate-700'

  const handleToggle = async () => {
    setLoading(true)
    try {
      await registerHackathon(h.id)
      const nextReg = !registered
      setRegistered(nextReg)
      if (onToggleRegister) onToggleRegister(h.id, nextReg)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <article
      className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg ${card}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {registered && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-900/30 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                <CheckCircle size={11} /> Registered
              </span>
            )}
            <span className={`text-xs font-medium ${urgent ? 'text-red-400' : muted} flex items-center gap-1`}>
              <Clock size={11} /> {urgency}
            </span>
          </div>
          <h2 className="font-bold text-base leading-snug mb-0.5">{h.title}</h2>
          <p className={`text-xs ${muted}`}>{h.organizer}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-violet-400">{h.prize}</div>
          <div className={`text-xs ${muted}`}>prize pool</div>
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm leading-relaxed ${muted} line-clamp-2`}>{h.description}</p>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={`flex items-center gap-1.5 ${muted}`}>
          <Calendar size={12} className="flex-shrink-0" />
          {formatDate(h.date)} – {formatDate(h.endDate)}
        </div>
        <div className={`flex items-center gap-1.5 ${muted}`}>
          <MapPin size={12} className="flex-shrink-0" />
          <span className="truncate">{h.location}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${muted}`}>
          <Users size={12} className="flex-shrink-0" />
          Team: {h.teamSize}
        </div>
        <div className={`flex items-center gap-1.5 ${muted}`}>
          <Trophy size={12} className="flex-shrink-0" />
          {h.registered.toLocaleString()} registered
        </div>
      </div>

      {/* Tracks */}
      <div>
        <p className={`text-xs font-medium ${muted} mb-1.5`}>Tracks</p>
        <div className="flex flex-wrap gap-1.5">
          {h.tracks.map(t => (
            <span key={t} className={`text-xs px-2 py-0.5 rounded-md border font-medium ${isDark ? 'bg-slate-900/60 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {h.tags.map(tag => (
          <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tagClass(tag)}`}>
            #{tag}
          </span>
        ))}
      </div>

      {/* Action */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
          registered
            ? isDark
              ? 'bg-slate-700 hover:bg-red-900/40 hover:border-red-700/50 border border-slate-600 text-slate-300 hover:text-red-300'
              : 'bg-slate-100 hover:bg-red-50 border border-slate-200 text-slate-600 hover:text-red-600'
            : 'bg-violet-600 hover:bg-violet-500 text-white'
        }`}
        aria-label={registered ? `Withdraw from ${h.title}` : `Register for ${h.title}`}
      >
        {loading ? 'Processing...' : (registered ? 'Withdraw Registration' : 'Register Now')}
      </button>
    </article>
  )
}


export default function HackathonsPage() {
  const { isDark } = useTheme()
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [showRegistered, setShowRegistered] = useState(false)
  const [hackathonsList, setHackathonsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHackathons().then(data => {
      setHackathonsList(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  if (loading) {
    return <div className="p-6 lg:p-8 max-w-7xl theme-text">Loading hackathons...</div>
  }

  const handleToggleRegister = (id, isRegistered) => {
    setHackathonsList(prev =>
      prev.map(h => (h.id === id ? { ...h, userRegistered: isRegistered } : h))
    )
  }

  const allTags = [...new Set(hackathonsList.flatMap(h => h.tags))]

  const filtered = hackathonsList.filter(h => {
    const q = search.toLowerCase()
    const matchSearch = !q || h.title.toLowerCase().includes(q) || h.organizer.toLowerCase().includes(q) || h.tags.some(t => t.toLowerCase().includes(q))
    const matchTag = !activeTag || h.tags.includes(activeTag)
    const matchReg = !showRegistered || h.userRegistered
    return matchSearch && matchTag && matchReg
  })

  const registeredCount = hackathonsList.filter(h => h.userRegistered).length

  const bg = isDark ? 'bg-slate-950' : 'bg-slate-50'
  const inputBg = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-violet-500'
    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-500'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'


  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Calendar size={22} className="text-violet-400" />
          Hackathons
        </h1>
        <p className={`text-sm ${muted}`}>
          {hackathonsList.length} upcoming events · {registeredCount} registered
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Upcoming', val: hackathonsList.length, color: 'text-violet-400' },
          { label: 'Registered', val: registeredCount, color: 'text-emerald-400' },
          { label: 'Total Prize', val: '₹18L+', color: 'text-amber-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`rounded-xl p-4 border text-center ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'}`}>
            <div className={`text-2xl font-bold ${color}`}>{val}</div>
            <div className={`text-xs ${muted} mt-0.5`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted} pointer-events-none`} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hackathons..."
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${inputBg}`}
          />
        </div>
        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer select-none text-sm font-medium transition-colors ${
          showRegistered
            ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
            : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
        }`}>
          <input type="checkbox" className="sr-only" checked={showRegistered} onChange={e => setShowRegistered(e.target.checked)} />
          <Filter size={14} />
          My registrations
        </label>
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTag('')}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            !activeTag
              ? 'bg-violet-600 border-violet-500 text-white'
              : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
          }`}
        >
          All
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(t => t === tag ? '' : tag)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              activeTag === tag
                ? 'bg-violet-600 border-violet-500 text-white'
                : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className={`text-xs ${muted} mb-4`}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={36} className={`${muted} mx-auto mb-3`} />
          <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No hackathons match your search</p>
          <button onClick={() => { setSearch(''); setActiveTag(''); setShowRegistered(false) }} className="text-sm text-violet-400 hover:text-violet-300 mt-2">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(h => (
            <HackathonCard key={h.id} h={h} isDark={isDark} onToggleRegister={handleToggleRegister} />
          ))}
        </div>
      )}

    </div>
  )
}
