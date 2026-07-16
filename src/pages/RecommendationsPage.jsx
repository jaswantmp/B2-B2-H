// src/pages/RecommendationsPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, Trophy, Users, TrendingUp, Star, Zap } from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import InviteModal from '../components/InviteModal.jsx'
import { getRecommendations } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'


const MATCH_SCORES = { 1: 96, 2: 91, 3: 88, 4: 84 }

const STATUS_LABELS = {
  LOOKING_FOR_TEAM:    { label: 'Looking For Team',    dot: '#10B981' },
  OPEN_TO_INVITES:     { label: 'Open To Invitations', dot: '#F59E0B' },
  LOOKING_FOR_MEMBERS: { label: 'Looking For Members', dot: '#06B6D4' },
  IN_TEAM:             { label: 'Already In Team',     dot: '#EF4444' },
  OFFLINE:             { label: 'Offline',             dot: '#6B7280' },
}

const FIT_COLORS = {
  'AI/ML':      'bg-violet-100 dark:bg-violet-900/30 border-violet-400 dark:border-violet-800/40 text-violet-800 dark:text-violet-400 font-semibold',
  'Backend':    'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700/50 text-cyan-800 dark:text-cyan-300 font-semibold',
  'Design':     'bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-700/50 text-pink-800 dark:text-pink-300 font-semibold',
  'Frontend':   'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-800/40 text-blue-800 dark:text-blue-400 font-semibold',
  'Blockchain': 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 font-semibold',
  'Web3':       'bg-orange-100 dark:bg-amber-900/30 border-orange-400 dark:border-amber-800/40 text-orange-800 dark:text-amber-400 font-semibold',
  'UI':         'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700/50 text-indigo-800 dark:text-indigo-300 font-semibold',
}

function ScoreRing({ score }) {
  const color = score >= 90 ? '#10B981' : score >= 80 ? '#F59E0B' : '#06B6D4'
  const r = 22
  const circ = 2 * Math.PI * r

  return (
    <div className="relative w-14 h-14 flex-shrink-0" aria-label={`${score}% match score`}>
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--bg-raised)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold theme-text">
        {score}%
      </span>
    </div>
  )
}

function RecCard({ rec, onInvite }) {
  const { builder, reason, fitAreas, hackathon } = rec
  const score     = rec.compatibility_score ?? MATCH_SCORES[rec.id] ?? 80
  const statusCfg = STATUS_LABELS[builder.status] || STATUS_LABELS.OFFLINE

  return (
    <article
      className="rounded-2xl p-5 border hover:border-violet-500/50 transition-all duration-200"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Top row */}
      <div className="flex items-start gap-4 mb-4">
        <PulseAvatar user={builder} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold theme-text text-base leading-tight">{builder.name}</h3>
              <p className="text-sm theme-muted mt-0.5">{builder.branch} · {builder.university}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: statusCfg.dot }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: statusCfg.dot }} />
                  {statusCfg.label}
                </span>
                <span className="theme-muted text-xs">·</span>
                <span className="flex items-center gap-1 text-xs theme-muted">
                  <MapPin size={11} /> {builder.location}
                </span>
                <span className="flex items-center gap-1 text-xs theme-muted">
                  <Trophy size={11} /> {builder.hackathonsWon} wins
                </span>
              </div>
            </div>
            <ScoreRing score={score} />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {builder.skills.slice(0, 5).map(skill => (
          <SkillBadge key={skill} skill={skill} verified={builder.verifiedSkills?.includes(skill)} />
        ))}
        {builder.skills.length > 5 && (
          <span className="text-xs theme-muted self-center">+{builder.skills.length - 5}</span>
        )}
      </div>

      {/* AI explanation */}
      <div
        className="rounded-xl p-4 mb-4 border border-violet-400 dark:border-violet-800/30"
        style={{ backgroundColor: 'var(--bg-raised)' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={13} className="text-violet-800 dark:text-violet-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold text-violet-800 dark:text-violet-400 uppercase tracking-wide">
            Why this builder fits your team
          </span>
        </div>
        <p className="text-sm theme-text-secondary leading-relaxed">{reason}</p>
      </div>

      {/* Fit areas */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs theme-muted">Fills:</span>
          {fitAreas.map(area => (
            <span key={area} className={`text-xs px-2 py-0.5 rounded-md border font-medium ${FIT_COLORS[area] ?? 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              {area}
            </span>
          ))}
        </div>
        <span className="text-xs theme-muted flex-shrink-0">
          for <span className="theme-text-secondary font-medium">{hackathon}</span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t theme-divider">
        <button
          onClick={() => onInvite(builder)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
        >
          <Zap size={14} aria-hidden="true" /> Send Invite
        </button>
        <Link
          to={`/builders/${builder.id}`}
          className="px-4 py-2.5 rounded-xl theme-btn-ghost text-sm font-medium transition-colors text-center"
        >
          Profile
        </Link>
      </div>
    </article>
  )
}

export default function RecommendationsPage() {
  const { user } = useAuth()
  const [inviteUser, setInviteUser] = useState(null)
  const [dismissed, setDismissed]   = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecommendations().then(data => {
      setRecs(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  if (loading) {
    return <div className="p-4 sm:p-6 lg:p-8 max-w-4xl theme-text">Loading recommendations...</div>
  }

  const visible   = recs.filter(r => !dismissed.includes(r.id))
  const scores    = recs.map(r => MATCH_SCORES[r.id] ?? 80)
  const avgScore  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const topRec    = recs.length ? recs.reduce((a, b) => ((a.compatibility_score ?? MATCH_SCORES[a.id]) ?? 0) > ((b.compatibility_score ?? MATCH_SCORES[b.id]) ?? 0) ? a : b) : null
  const matchPercentage = topRec ? (topRec.compatibility_score ?? MATCH_SCORES[topRec.id]) : undefined


  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Sparkles size={22} className="text-violet-600 dark:text-violet-400" aria-hidden="true" />
          <h1 className="text-2xl font-bold theme-text">AI Matches</h1>
        </div>
        <p className="theme-muted text-sm">
          Builders recommended for <span className="theme-text font-medium">{user?.name ?? 'you'}</span>'s
          team based on skill gaps and availability.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: Users,      label: 'Recommendations', val: recs.length, sub: `${visible.length} active`, color: 'text-violet-600 dark:text-violet-400' },
          { icon: TrendingUp, label: 'Avg Match',        val: `${avgScore}%`,         sub: 'Above threshold',        color: 'text-emerald-600 dark:text-emerald-400' },
          { icon: Star,       label: 'Top Match',        val: topRec ? topRec.builder.name : 'N/A',    sub: `${matchPercentage ?? 0}% Fit`, color: 'text-amber-600 dark:text-amber-400' },
        ].map(({ icon: Icon, label, val, sub, color }) => (

          <div
            key={label}
            className="rounded-xl p-4 border theme-divider"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center gap-1.5 text-xs theme-muted font-medium uppercase tracking-wide mb-1">
              <Icon size={13} aria-hidden="true" /> {label}
            </div>
            <div className={`text-xl font-bold ${color} truncate`}>{val}</div>
            <div className="text-xs theme-muted mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div
        className="flex items-start gap-3 rounded-xl p-4 mb-6 border border-violet-400 dark:border-violet-800/30"
        style={{ backgroundColor: 'var(--bg-raised)' }}
      >
        <Sparkles size={15} className="text-violet-800 dark:text-violet-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm theme-text-secondary leading-relaxed">
          Matches are generated for <span className="text-violet-800 dark:text-violet-400 font-medium">HackIndia 2026</span> based
          on your team's current skill gaps. Every suggestion includes a plain-language explanation.
          You always decide who to invite.
        </p>
      </div>

      {/* Cards */}
      {visible.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles size={32} className="theme-muted mx-auto mb-3" />
          <p className="theme-text font-medium mb-1">No active recommendations</p>
          <p className="theme-muted text-sm">Check back after updating your team composition.</p>
          <button onClick={() => setDismissed([])} className="mt-4 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-750 dark:hover:text-violet-300 transition-colors">
            Restore dismissed
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {visible.map(rec => (
            <RecCard key={rec.id} rec={rec} onInvite={setInviteUser} />
          ))}
        </div>
      )}

      {inviteUser && <InviteModal user={inviteUser} onClose={() => setInviteUser(null)} />}
    </div>
  )
}
