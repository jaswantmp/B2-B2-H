// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles, TrendingUp, Users, Calendar, ArrowRight,
  Bell, Trophy, ChevronRight, Zap, Clock,
} from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import AvailabilityIndicator from '../components/AvailabilityIndicator.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getHackathons, getRecommendations, getNotifications } from '../services/api.js'


const STATUS_OPTIONS = [
  { value: 'LOOKING_FOR_TEAM',    label: 'Looking For Team',    color: '#10B981' },
  { value: 'OPEN_TO_INVITES',     label: 'Open To Invitations', color: '#F59E0B' },
  { value: 'LOOKING_FOR_MEMBERS', label: 'Looking For Members', color: '#06B6D4' },
  { value: 'IN_TEAM',             label: 'Already In Team',     color: '#EF4444' },
  { value: 'OFFLINE',             label: 'Offline',             color: '#6B7280' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus]         = useState(user?.status || 'LOOKING_FOR_TEAM')
  const [statusOpen, setStatusOpen] = useState(false)

  const [hackathonsList, setHackathonsList] = useState([])
  const [recommendationsList, setRecommendationsList] = useState([])
  const [notificationsList, setNotificationsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.onboarding_completed === false && !sessionStorage.getItem('onboarding_skipped')) {
      sessionStorage.setItem('onboarding_skipped', 'true')
      navigate('/onboarding')
    }
  }, [user, navigate])

  useEffect(() => {
    if (!user?.id) return
    const fetchDashboardData = async () => {
      try {
        const [hList, rList, nList] = await Promise.all([
          getHackathons().catch(err => {
            console.warn('Failed to load hackathons:', err)
            return []
          }),
          getRecommendations().catch(err => {
            console.warn('Failed to load recommendations:', err)
            return []
          }),
          getNotifications().catch(err => {
            console.warn('Failed to load notifications:', err)
            return []
          })
        ])
        setHackathonsList(hList || [])
        setRecommendationsList(rList || [])
        setNotificationsList(nList || [])
      } catch (err) {
        console.error('Unexpected error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [user])

  const unread             = notificationsList.filter(n => !n.read).length
  const upcomingHackathons = hackathonsList.slice(0, 3)
  const topRecs            = recommendationsList.slice(0, 2)
  const currentStatusCfg   = STATUS_OPTIONS.find(s => s.value === status)


  if (!user) return null

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl">

      {/* Onboarding Promo Banner */}
      {user?.onboarding_completed === false && (
        <div className="rounded-2xl p-5 border border-violet-500/20 bg-gradient-to-r from-violet-950/20 via-slate-900 to-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-900/40 border border-violet-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="text-violet-400" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1">Complete your Onboarding Profile</h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Unlock customized AI Team Matches, Builder Discovery, and automated recommendation filters by spending 2 minutes in our onboarding wizard.
              </p>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-violet-600/10"
          >
            Start Onboarding
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* ── Welcome banner ─────────────────────────────────────────── */}
      <section aria-label="Welcome">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PulseAvatar user={{ ...user, status }} size="xl" />
            <div>
              <h1 className="text-2xl font-bold theme-text">
                Good evening, {user.name.split(' ')[0]} 👋
              </h1>
              <p className="theme-muted text-sm mt-1">
                {user.branch} · {user.university}
              </p>
              <div className="mt-2">
                <AvailabilityIndicator status={status} />
              </div>
            </div>
          </div>

          {/* Status toggle */}
          <div className="relative">
            <button
              onClick={() => setStatusOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border theme-btn-ghost text-sm font-medium transition-all"
              aria-expanded={statusOpen}
              aria-haspopup="listbox"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStatusCfg?.color }} />
              <span className="theme-text">{currentStatusCfg?.label}</span>
              <ChevronRight
                size={14}
                className={`theme-muted transition-transform ${statusOpen ? 'rotate-90' : ''}`}
                aria-hidden="true"
              />
            </button>

            {statusOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl z-20 overflow-hidden border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
                role="listbox"
                aria-label="Set your availability"
              >
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={status === opt.value}
                    onClick={() => { setStatus(opt.value); setStatusOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                    style={{
                      backgroundColor: status === opt.value ? 'var(--bg-raised)' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-raised)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = status === opt.value ? 'var(--bg-raised)' : 'transparent'}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                    <span className="theme-text">{opt.label}</span>
                    {status === opt.value && <span className="ml-auto text-violet-500 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <section aria-label="Your stats" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Profile Views', value: '24',  sub: '+6 this week',  color: 'text-violet-500' },
          { icon: Users,      label: 'Team Invites',  value: '3',   sub: '2 pending',     color: 'text-amber-500'  },
          { icon: Calendar,   label: 'Hackathons',    value: '2',   sub: 'registered',    color: 'text-cyan-500'   },
          { icon: Trophy,     label: 'Wins',          value: user.hackathonsWon.toString(), sub: 'all time', color: 'text-emerald-500' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div
            key={label}
            className="theme-card p-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs theme-muted">{label}</span>
              <Icon size={15} className={color} aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold theme-text">{value}</div>
            <div className="text-xs theme-muted mt-0.5">{sub}</div>
          </div>
        ))}
      </section>

      {/* ── Main grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left col: AI matches + skills */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-violet-500" aria-hidden="true" />
              <h2 className="font-semibold theme-text">AI Matches for HackIndia 2026</h2>
            </div>
            <Link
              to="/recommendations"
              className="text-xs text-violet-500 hover:text-violet-400 flex items-center gap-1 transition-colors"
            >
              See all <ArrowRight size={12} />
            </Link>
          </div>

          {/* AI recommendation cards */}
          <div className="space-y-3">
            {topRecs.map(rec => (
              <div
                key={rec.id}
                className="rounded-xl border p-4 hover:border-violet-500/50 transition-all"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-start gap-3">
                  <PulseAvatar user={rec.builder} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm theme-text">{rec.builder.name}</p>
                        <p className="text-xs theme-muted">{rec.builder.branch} · {rec.builder.university}</p>
                      </div>
                      <Link
                        to="/recommendations"
                        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors text-violet-500 hover:text-violet-400"
                        style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-strong)' }}
                      >
                        Invite
                      </Link>
                    </div>
                    <p className="text-xs theme-muted mt-2 leading-relaxed line-clamp-2">{rec.reason}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rec.builder.skills.slice(0, 3).map(s => (
                        <SkillBadge key={s} skill={s} verified={rec.builder.verifiedSkills?.includes(s)} size="xs" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Skills summary */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <h3 className="text-sm font-semibold theme-text mb-3">Your verified skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map(s => (
                <SkillBadge key={s} skill={s} verified={user.verifiedSkills?.includes(s)} />
              ))}
            </div>
            <Link
              to="/settings"
              className="text-xs text-violet-500 hover:text-violet-400 mt-3 inline-flex items-center gap-1 transition-colors"
            >
              Update skills <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-4">
          {/* Notifications */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell size={15} className="theme-muted" aria-hidden="true" />
                <h2 className="text-sm font-semibold theme-text">Notifications</h2>
              </div>
              {unread > 0 && (
                <span className="text-xs bg-violet-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {notificationsList.slice(0, 3).map(n => (
                <div
                  key={n.id}
                  className="text-xs p-2.5 rounded-lg border"
                  style={{
                    backgroundColor: n.read ? 'transparent' : 'rgba(139,92,246,0.08)',
                    borderColor: n.read ? 'var(--border-subtle)' : 'rgba(139,92,246,0.3)',
                  }}
                >
                  <p className={`line-clamp-2 leading-relaxed ${n.read ? 'theme-muted' : 'theme-text'}`}>
                    {n.message}
                  </p>
                  <p className="theme-muted mt-1" style={{ opacity: 0.7 }}>{n.time}</p>
                </div>
              ))}
            </div>

            <Link
              to="/notifications"
              className="text-xs text-violet-500 hover:text-violet-400 mt-3 inline-flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {/* Upcoming hackathons */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="theme-muted" aria-hidden="true" />
                <h2 className="text-sm font-semibold theme-text">Upcoming Hackathons</h2>
              </div>
            </div>

            <div className="space-y-2">
              {upcomingHackathons.map(h => (
                <Link
                  key={h.id}
                  to="/hackathons"
                  className="flex items-center justify-between p-2.5 rounded-lg border transition-all"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-raised)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <p className="text-xs font-medium theme-text line-clamp-1">{h.title}</p>
                    <p className="text-xs theme-muted flex items-center gap-1 mt-0.5">
                      <Clock size={10} aria-hidden="true" />
                      {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {h.userRegistered
                    ? <span className="text-xs text-emerald-500 font-medium flex-shrink-0">Registered</span>
                    : <span className="text-xs text-violet-500 font-medium flex-shrink-0">Join →</span>
                  }
                </Link>
              ))}
            </div>

            <Link
              to="/hackathons"
              className="text-xs text-violet-500 hover:text-violet-400 mt-3 inline-flex items-center gap-1 transition-colors"
            >
              Browse all <ArrowRight size={11} />
            </Link>
          </div>

          {/* AI Team Generator CTA */}
          <Link
            to="/generator"
            className="block rounded-xl border p-4 hover:border-violet-500/50 transition-all group"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.08) 100%)',
              borderColor: 'rgba(139,92,246,0.3)',
            }}
          >
            <div className="flex items-center gap-2 text-violet-500 text-sm font-semibold mb-1.5">
              <Zap size={15} aria-hidden="true" />
              AI Team Generator
            </div>
            <p className="text-xs theme-muted leading-relaxed mb-3">
              Describe your project idea and get a complete team blueprint with matched builders instantly.
            </p>
            <div className="flex items-center gap-1 text-xs text-violet-500 group-hover:text-violet-400 font-medium transition-colors">
              Try it now <ArrowRight size={12} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
