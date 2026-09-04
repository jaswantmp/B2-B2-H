// src/pages/HackathonsPage.jsx
import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, MapPin, Users, Trophy, Search, Tag,
  CheckCircle, Clock, ExternalLink, Filter, Sparkles, Brain, X
} from 'lucide-react'
import { getHackathons, registerHackathon, withdrawHackathon, getHackathonRecommendations } from '../services/api.js'
import { useTheme } from '../context/ThemeContext.jsx'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(d) {
  const diff = Math.ceil((new Date(d) - Date.now()) / 86400000)
  if (diff < 0) return 'Ended'
  if (diff === 0) return 'Today'
  return `${diff}d left`
}

const TAG_COLORS = {
  AI: 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-800/40 text-violet-800 dark:text-violet-400 font-semibold',
  Web3: 'bg-orange-100 dark:bg-amber-900/30 border-orange-300 dark:border-amber-800/40 text-orange-800 dark:text-amber-400 font-semibold',
  Blockchain: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800/40 text-blue-800 dark:text-blue-400 font-semibold',
  Global: 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-semibold',
  Government: 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 font-semibold',
  MLH: 'bg-pink-100 dark:bg-pink-900/50 border-pink-300 dark:border-pink-700/60 text-pink-800 dark:text-pink-300 font-semibold',
}

function tagClass(tag) {
  return TAG_COLORS[tag] ?? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
}

function getMatchBadgeDetails(score) {
  if (score >= 90) return { label: 'Excellent Match', colorClass: 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-400', dotColor: 'bg-emerald-500' }
  if (score >= 75) return { label: 'Strong Match', colorClass: 'bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-950/40 dark:border-violet-800/50 dark:text-violet-400', dotColor: 'bg-violet-500' }
  if (score >= 60) return { label: 'Good Match', colorClass: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800/50 dark:text-blue-400', dotColor: 'bg-blue-500' }
  if (score >= 40) return { label: 'Average Match', colorClass: 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-400', dotColor: 'bg-amber-500' }
  return { label: 'Average Match', colorClass: 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-900/50 dark:border-slate-800/50 dark:text-slate-400', dotColor: 'bg-slate-500' }
}

function HackathonCard({ h, isDark, onToggleRegister, onViewDetails }) {
  const [registered, setRegistered] = useState(h.userRegistered)
  const [loading, setLoading] = useState(false)
  const urgency = daysUntil(h.date)
  const urgent = !isNaN(parseInt(urgency)) && parseInt(urgency) <= 7

  useEffect(() => {
    setRegistered(h.userRegistered)
  }, [h.userRegistered])

  const card = isDark
    ? `bg-slate-800/50 border-slate-700/50 hover:border-violet-700/50`
    : `bg-white border-slate-200 hover:border-violet-400/60`

  const muted = isDark ? 'text-slate-400' : 'text-slate-500'

  const handleToggle = async (e) => {
    e.stopPropagation()
    setLoading(true)
    try {
      if (registered) {
        await withdrawHackathon(h.id)
      } else {
        await registerHackathon(h.id)
      }
      const nextReg = !registered
      setRegistered(nextReg)
      if (onToggleRegister) onToggleRegister(h.id, nextReg)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Recommended highlights
  const recBadge = h.recommendation ? getMatchBadgeDetails(h.recommendation.score) : null

  return (
    <article
      className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg ${card}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {registered && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                <CheckCircle size={11} /> Registered
              </span>
            )}
            <span className={`text-xs font-medium ${urgent ? 'text-red-500 font-semibold' : muted} flex items-center gap-1`}>
              <Clock size={11} /> {urgency}
            </span>
            {recBadge && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${recBadge.colorClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${recBadge.dotColor}`} />
                ⭐ {h.recommendation.score}% {h.recommendation.is_ml_powered ? 'ML Match' : 'Match'} ({recBadge.label})
              </span>
            )}
          </div>
          <h2 className="font-bold text-base leading-snug mb-0.5 theme-text">{h.title}</h2>
          <p className={`text-xs ${muted}`}>{h.organizer}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-violet-500 dark:text-violet-400">{h.prize}</div>
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
          {(h.registered ?? 0).toLocaleString()} registered
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {[...new Set(h.tags)].map(tag => (
          <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tagClass(tag)}`}>
            #{tag}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onViewDetails(h)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border theme-btn-ghost"
        >
          View Details
        </button>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            registered
              ? isDark
                ? 'bg-slate-700 hover:bg-red-900/40 hover:border-red-700/50 border border-slate-600 text-slate-300 hover:text-red-300'
                : 'bg-slate-100 hover:bg-red-50 border border-slate-200 text-slate-600 hover:text-red-600'
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/10'
          }`}
        >
          {loading ? 'Processing...' : (registered ? 'Withdraw' : 'Register')}
        </button>
      </div>
    </article>
  )
}
function HackathonDetailsModal({ h, onClose, isDark, onToggleRegister }) {
  const modalRef = useRef(null)
  const [registered, setRegistered] = useState(h.userRegistered)
  const [loading, setLoading] = useState(false)
  const rec = h.recommendation

  useEffect(() => {
    setRegistered(h.userRegistered)
  }, [h.userRegistered])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus()
    }
  }, [])

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (registered) {
        await withdrawHackathon(h.id)
      } else {
        await registerHackathon(h.id)
      }
      const nextReg = !registered
      setRegistered(nextReg)
      if (onToggleRegister) onToggleRegister(h.id, nextReg)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const badgeInfo = rec ? getMatchBadgeDetails(rec.score) : null
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500'
  const textPrimary = isDark ? 'text-slate-200' : 'text-slate-800'
  const cardBg = isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${h.title} details`}
    >
      <div
        ref={modalRef}
        tabIndex="-1"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl relative outline-none flex flex-col gap-6 animate-scale-up"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors theme-text"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {badgeInfo && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeInfo.colorClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badgeInfo.dotColor}`} />
                ⭐ {rec.score}% Match ({badgeInfo.label})
              </span>
            )}
            {registered && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                <CheckCircle size={11} /> Registered
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold theme-text">{h.title}</h2>
          <p className={`text-xs ${textMuted} mt-0.5`}>{h.organizer}</p>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs border-t border-b py-3 theme-border">
          <div className={`flex items-center gap-2 ${textMuted}`}>
            <Calendar size={13} className="flex-shrink-0" />
            <span>Dates: <strong className={textPrimary}>{formatDate(h.date)} – {formatDate(h.endDate)}</strong></span>
          </div>
          <div className={`flex items-center gap-2 ${textMuted}`}>
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">Location: <strong className={textPrimary}>{h.location}</strong></span>
          </div>
          <div className={`flex items-center gap-2 ${textMuted}`}>
            <Trophy size={13} className="flex-shrink-0" />
            <span>Prize Pool: <strong className="text-violet-600 dark:text-violet-400 font-bold">{h.prize}</strong></span>
          </div>
          <div className={`flex items-center gap-2 ${textMuted}`}>
            <Users size={13} className="flex-shrink-0" />
            <span>Team Limit: <strong className={textPrimary}>{h.teamSize} members</strong></span>
          </div>
        </div>

        {/* Description & Tracks */}
        <div className="space-y-3 text-sm">
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-1">Description</h3>
            <p className={`${textMuted} leading-relaxed`}>{h.description}</p>
          </div>
          {h.tracks && h.tracks.length > 0 && (
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-1.5">Tracks</h3>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(h.tracks)].map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-md border theme-btn-ghost font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Recommendations Panel */}
        {rec && (
          <div className="border-t theme-border pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
                <Brain size={16} />
                <span>ML Match Analysis</span>
              </div>
              {rec.model_version && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  {rec.model_version}
                </span>
              )}
            </div>

            {/* Score Breakdown Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Skills Match</span>
                  <span className="font-bold theme-text">{rec.breakdown?.skills ?? 0} / 40</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${((rec.breakdown?.skills ?? 0) / 40) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Domains Fit</span>
                  <span className="font-bold theme-text">{rec.breakdown?.domains ?? 0} / 35</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${((rec.breakdown?.domains ?? 0) / 35) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Branch fit</span>
                  <span className="font-bold theme-text">{rec.breakdown?.branch ?? 0} / 15</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${((rec.breakdown?.branch ?? 0) / 15) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Academic Year fit</span>
                  <span className="font-bold theme-text">{rec.breakdown?.year ?? 0} / 10</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((rec.breakdown?.year ?? 0) / 10) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Matched and Missing Lists */}
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`${textMuted} font-semibold`}>Matched Skills:</span>
                {rec.matched_skills.length > 0 ? (
                  rec.matched_skills.map(sk => <span key={sk} className="text-violet-700 bg-violet-100 border border-violet-200 dark:text-violet-400 dark:bg-violet-950/20 dark:border-violet-900/40 px-2 py-0.5 rounded">{sk}</span>)
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`${textMuted} font-semibold`}>Matched Interests:</span>
                {rec.matched_domains.length > 0 ? (
                  rec.matched_domains.map(dom => <span key={dom} className="text-cyan-700 bg-cyan-100 border border-cyan-200 dark:text-cyan-400 dark:bg-cyan-950/20 dark:border-cyan-900/40 px-2 py-0.5 rounded">{dom}</span>)
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </div>
              {rec.missing_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`${textMuted} font-semibold`}>Missing Skills:</span>
                  {rec.missing_skills.map(sk => <span key={sk} className="text-rose-700 bg-rose-100 border border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/40 px-2 py-0.5 rounded">{sk}</span>)}
                </div>
              )}
            </div>

            {/* Suitability Analysis Explanations */}
            <div className={`rounded-xl p-4 border ${cardBg} text-xs space-y-1.5`}>
              <div className="font-bold text-violet-700 dark:text-violet-400 flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wide">
                <Sparkles size={11} /> Why Recommended
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                {rec.explanation.map((expLine, idx) => (
                  <li key={idx}>{expLine}</li>
                ))}
              </ul>
            </div>

            {/* Recommended Learning Path */}
            {rec.missing_skills.length > 0 && (
              <div className={`rounded-xl p-4 border border-cyan-500/10 bg-cyan-500/5 text-xs space-y-1.5`}>
                <div className="font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wide">
                  <BookOpenIcon size={11} /> Recommended Learning Path
                </div>
                <p className={`${textMuted} mb-1.5`}>Learn before participating to maximize your project success:</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  {rec.missing_skills.map(sk => (
                    <div key={sk} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      <span>{sk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-3 mt-2 border-t theme-border pt-4">
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              registered
                ? isDark
                  ? 'bg-slate-700 hover:bg-red-900/40 hover:border-red-700/50 border border-slate-600 text-slate-300 hover:text-red-300'
                  : 'bg-slate-100 hover:bg-red-50 border border-slate-200 text-slate-600 hover:text-red-600'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/10'
            }`}
          >
            {loading ? 'Processing...' : (registered ? 'Withdraw Registration' : 'Register Now')}
          </button>
        </div>
      </div>
    </div>
  )
}

function BookOpenIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

export default function HackathonsPage() {
  const { isDark } = useTheme()
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [showRegistered, setShowRegistered] = useState(false)
  const [recommendedOnly, setRecommendedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('Recommended')

  const [hackathonsList, setHackathonsList] = useState([])
  const [recommendationsList, setRecommendationsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHackathon, setSelectedHackathon] = useState(null)
  
  // Personalization banner state
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return sessionStorage.getItem('recommendation_banner_dismissed') === 'true'
  })

  useEffect(() => {
    Promise.all([
      getHackathons().catch(err => {
        console.warn("Failed to load hackathons list:", err)
        return []
      }),
      getHackathonRecommendations().catch(err => {
        console.warn("Failed to load recommendations list:", err)
        return null
      })
    ]).then(([hData, rData]) => {
      const recommendations = rData?.recommendations || []
      setRecommendationsList(recommendations)

      // Map recommendations by hackathon ID for instant lookup
      const recMap = {}
      recommendations.forEach(r => {
        if (r.hackathon?.id) {
          recMap[r.hackathon.id] = r
        }
      })

      const normalized = (hData || []).map(h => ({
        ...h,
        endDate: h.endDate || h.end_date,
        teamSize: h.teamSize || h.team_size || 'N/A',
        registered: h.registered ?? h.registered_count ?? 0,
        userRegistered: h.userRegistered ?? h.user_registered ?? false,
        recommendation: recMap[h.id] || null
      }))

      setHackathonsList(normalized)
      
      // If user has no recommendations, fall back to "Latest" sorting
      if (recommendations.length === 0) {
        setSortBy('Latest')
      }

      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const handleToggleRegister = (id, isRegistered) => {
    setHackathonsList(prev =>
      prev.map(h => (h.id === id ? { ...h, userRegistered: isRegistered } : h))
    )
  }

  const allTags = useMemo(() => {
    return [...new Set(hackathonsList.flatMap(h => h.tags))]
  }, [hackathonsList])
  const filteredHackathons = useMemo(() => {
    let result = hackathonsList.filter(h => {
      const q = search.toLowerCase()
      const matchSearch = !q || h.title.toLowerCase().includes(q) || h.organizer.toLowerCase().includes(q) || h.tags.some(t => t.toLowerCase().includes(q))
      const matchTag = !activeTag || h.tags.includes(activeTag)
      const matchReg = !showRegistered || h.userRegistered
      const matchRec = !recommendedOnly || !!h.recommendation
      return matchSearch && matchTag && matchReg && matchRec
    })

    // Copy array to avoid mutating original state references
    let sorted = [...result]

    // Apply Sorting
    if (sortBy === 'Recommended') {
      sorted.sort((a, b) => {
        const scoreA = a.recommendation?.score ?? 0
        const scoreB = b.recommendation?.score ?? 0
        if (scoreA !== scoreB) return scoreB - scoreA
        return new Date(b.date) - new Date(a.date) // Tie breaker: newest first
      })
    } else if (sortBy === 'Latest') {
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date))
    } else if (sortBy === 'Deadline') {
      sorted.sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    } else if (sortBy === 'Prize Pool') {
      const parsePrize = (str) => {
        if (!str) return 0
        const clean = str.replace(/[^\d]/g, '')
        return clean ? parseInt(clean, 10) : 0
      }
      sorted.sort((a, b) => parsePrize(b.prize) - parsePrize(a.prize))
    } else if (sortBy === 'Alphabetical') {
      sorted.sort((a, b) => a.title.localeCompare(b.title))
    }

    return sorted
  }, [hackathonsList, search, activeTag, showRegistered, recommendedOnly, sortBy])
  const handleDismissBanner = () => {
    setBannerDismissed(true)
    sessionStorage.setItem('recommendation_banner_dismissed', 'true')
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  const registeredCount = hackathonsList.filter(h => h.userRegistered).length
  const hasRecs = recommendationsList.length > 0
  const inputBg = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-violet-500'
    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-500'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl space-y-6">
      
      {/* Personalization Banner when no recommendations exist */}
      {!hasRecs && !bannerDismissed && (
        <div className="rounded-2xl p-5 border border-violet-500/20 bg-gradient-to-r from-violet-950/20 via-slate-900 to-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4 relative animate-fade-in">
          <button
            onClick={handleDismissBanner}
            className="absolute right-3 top-3 p-1 rounded-full text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-900/40 border border-violet-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="text-violet-400" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 flex items-center gap-1.5">
                ✨ Personalize Your Recommendations
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Complete your profile by adding skills and domains to unlock AI-powered hackathon recommendations.
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-lg shadow-violet-600/10 text-center"
          >
            Update Profile
          </Link>
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 theme-text">
          <Calendar size={22} className="text-violet-500" />
          Hackathons
        </h1>
        <p className={`text-sm ${muted}`}>
          {hackathonsList.length} upcoming events · {registeredCount} registered
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Upcoming', val: hackathonsList.length, color: 'text-violet-500 dark:text-violet-400' },
          { label: 'Registered', val: registeredCount, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total Prize', val: '₹18L+', color: 'text-amber-600 dark:text-amber-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`rounded-xl p-4 border text-center ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'}`}>
            <div className={`text-2xl font-bold ${color}`}>{val}</div>
            <div className={`text-xs ${muted} mt-0.5`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        {/* Search */}
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

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold whitespace-nowrap ${muted}`}>Sort By</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-xl border text-sm font-medium theme-input cursor-pointer"
          >
            {hasRecs && <option value="Recommended">Recommended</option>}
            <option value="Latest">Latest</option>
            <option value="Deadline">Deadline</option>
            <option value="Prize Pool">Prize Pool</option>
            <option value="Alphabetical">Alphabetical</option>
          </select>
        </div>

        {/* Recommended Only quick chip */}
        {hasRecs && (
          <button
            onClick={() => setRecommendedOnly(!recommendedOnly)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              recommendedOnly
                ? 'bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-700/50 dark:text-violet-300'
                : 'theme-btn-ghost'
            }`}
          >
            <span>⭐ Recommended Only</span>
          </button>
        )}

        {/* My Registrations filter */}
        <label className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer select-none text-sm font-semibold transition-colors ${
          showRegistered
            ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-300'
            : 'theme-btn-ghost'
        }`}>
          <input type="checkbox" className="sr-only" checked={showRegistered} onChange={e => setShowRegistered(e.target.checked)} />
          <Filter size={14} />
          My registrations
        </label>
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTag('')}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            !activeTag
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'theme-btn-ghost'
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
                : 'theme-btn-ghost'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className={`text-xs ${muted}`}>{filteredHackathons.length} result{filteredHackathons.length !== 1 ? 's' : ''}</p>

      {/* Cards grid */}
      {filteredHackathons.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed theme-border rounded-2xl">
          <Calendar size={36} className={`${muted} mx-auto mb-3`} />
          <p className="font-semibold theme-text">No hackathons match your filters</p>
          <button onClick={() => { setSearch(''); setActiveTag(''); setShowRegistered(false); setRecommendedOnly(false) }} className="text-sm text-violet-500 hover:text-violet-400 mt-2 font-medium">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredHackathons.map(h => (
            <HackathonCard
              key={h.id}
              h={h}
              isDark={isDark}
              onToggleRegister={handleToggleRegister}
              onViewDetails={setSelectedHackathon}
            />
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedHackathon && (
        <HackathonDetailsModal
          h={selectedHackathon}
          isDark={isDark}
          onClose={() => setSelectedHackathon(null)}
          onToggleRegister={handleToggleRegister}
        />
      )}

    </div>
  )
}
