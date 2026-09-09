// src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles, FolderGit2, Users, Calendar, ArrowRight,
  Bell, Trophy, ChevronRight, Zap, Clock, RefreshCw,
} from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import AvailabilityIndicator from '../components/AvailabilityIndicator.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getHackathons, getRecommendations, getNotifications, getUserTeamInvites, getProjects } from '../services/api.js'


const STATUS_OPTIONS = [
  { value: 'LOOKING_FOR_TEAM',    label: 'Looking For Team',    color: '#10B981' },
  { value: 'OPEN_TO_INVITES',     label: 'Open To Invitations', color: '#F59E0B' },
  { value: 'LOOKING_FOR_MEMBERS', label: 'Looking For Members', color: '#06B6D4' },
  { value: 'IN_TEAM',             label: 'Already In Team',     color: '#EF4444' },
  { value: 'OFFLINE',             label: 'Offline',             color: '#6B7280' },
]

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus]         = useState(user?.status || 'LOOKING_FOR_TEAM')
  const [statusOpen, setStatusOpen] = useState(false)

  const [hackathonsList, setHackathonsList]           = useState([])
  const [recommendationsList, setRecommendationsList] = useState([])
  const [notificationsList, setNotificationsList]     = useState([])
  const [teamInvitesList, setTeamInvitesList]         = useState([])
  const [projectsList, setProjectsList]               = useState([])

  const [recsLoading, setRecsLoading] = useState(true)
  const [recsError, setRecsError]     = useState(null)

  useEffect(() => {
    if (user && user.onboarding_completed === false && !sessionStorage.getItem('onboarding_skipped')) {
      sessionStorage.setItem('onboarding_skipped', 'true')
      navigate('/onboarding')
    }
  }, [user, navigate])

  const loadRecommendations = useCallback(async () => {
    setRecsLoading(true)
    setRecsError(null)
    try {
      const recs = await getRecommendations()
      setRecommendationsList(recs || [])
    } catch (err) {
      if (err.name === 'AbortError' && err.message === 'Request aborted') {
        return
      }
      console.warn('Failed to load recommendations:', err)
      setRecsError(err?.message || 'Failed to load recommendations')
    } finally {
      setRecsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user?.id) return

    let cancelled = false

    getHackathons()
      .then(hList => { if (!cancelled) setHackathonsList(hList || []) })
      .catch(err => console.warn('Failed to load hackathons:', err))

    getNotifications()
      .then(nList => { if (!cancelled) setNotificationsList(nList || []) })
      .catch(err => console.warn('Failed to load notifications:', err))

    getUserTeamInvites()
      .then(iList => { if (!cancelled) setTeamInvitesList(iList || []) })
      .catch(err => console.warn('Failed to load team invites:', err))

    getProjects()
      .then(pList => { if (!cancelled) setProjectsList(pList || []) })
      .catch(err => console.warn('Failed to load projects:', err))

    loadRecommendations()

    return () => {
      cancelled = true
    }
  }, [authLoading, user?.id, loadRecommendations])

  // Derive real statistics for the logged-in user
  const userProjects = projectsList.filter(p => {
    const uid = String(user?.id || '')
    if (!uid) return false
    if (p.creator_id && String(p.creator_id) === uid) return true
    if (p.creator?.id && String(p.creator.id) === uid) return true
    if (Array.isArray(p.members) && p.members.some(m => String(m.user_id || m.user?.id || m.id) === uid)) return true
    if (Array.isArray(p.team) && p.team.some(b => String(b.id) === uid)) return true
    return false
  })
  const projectsCount = userProjects.length || (user?.projects?.length ?? 0)
  const invitesCount = teamInvitesList.length
  const registeredHackathonsCount = hackathonsList.filter(h => Boolean(h.userRegistered || h.user_registered)).length
  const winsCount = (user?.hackathonsWon ?? user?.hackathons_won ?? 0).toString()

  const unread             = notificationsList.filter(n => !n.read).length
  const upcomingHackathons = hackathonsList.slice(0, 3)
  const topRecs            = recommendationsList.slice(0, 2)
  const currentStatusCfg   = STATUS_OPTIONS.find(s => s.value === status)

  if (authLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl animate-pulse">
        <div className="h-20 bg-slate-800/40 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-800/40 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-slate-800/40 rounded-xl" />
            <div className="h-32 bg-slate-800/40 rounded-xl" />
          </div>
          <div className="h-64 bg-slate-800/40 rounded-xl" />
        </div>
      </div>
    )
  }

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
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold theme-text">
                  Good evening, {user.name.split(' ')[0]} 👋
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400">
                  Demo Environment
                </span>
              </div>
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

      {/* ── Stats row (Real Database-Derived Metrics) ─────────────── */}
      <section aria-label="Your stats" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: FolderGit2,
            label: 'Projects',
            value: projectsCount.toString(),
            sub: projectsCount === 0 ? 'no projects' : projectsCount === 1 ? '1 active / joined' : `${projectsCount} active / joined`,
            color: 'text-violet-500',
          },
          {
            icon: Users,
            label: 'Team Invites',
            value: invitesCount.toString(),
            sub: invitesCount === 0 ? '0 pending' : invitesCount === 1 ? '1 pending' : `${invitesCount} pending`,
            color: 'text-amber-500',
          },
          {
            icon: Calendar,
            label: 'Hackathons',
            value: registeredHackathonsCount.toString(),
            sub: registeredHackathonsCount === 1 ? '1 registered' : `${registeredHackathonsCount} registered`,
            color: 'text-cyan-500',
          },
          {
            icon: Trophy,
            label: 'Wins',
            value: winsCount,
            sub: 'all time',
            color: 'text-emerald-500',
          },
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
            {recsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div
                    key={i}
                    className="rounded-xl border p-4 animate-pulse flex items-start gap-3"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-700/50 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700/50 rounded w-1/3" />
                      <div className="h-3 bg-slate-700/30 rounded w-1/2" />
                      <div className="h-3 bg-slate-700/20 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recsError ? (
              <div
                className="rounded-xl border p-4 text-center space-y-3"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                <p className="text-xs text-red-400 font-medium">
                  Unable to connect to recommendation service right now.
                </p>
                <button
                  onClick={() => loadRecommendations()}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw size={13} className={recsLoading ? 'animate-spin' : ''} />
                  Retry Loading Recommendations
                </button>
              </div>
            ) : topRecs.length === 0 ? (
              <div
                className="rounded-xl border p-6 text-center space-y-2"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <p className="text-sm font-semibold theme-text">No Recommended Builders Found</p>
                <p className="text-xs theme-muted max-w-md mx-auto">
                  We currently don't have builder matches for your profile. Update your skills or check back soon as new builders join!
                </p>
              </div>
            ) : (
              topRecs.map(rec => (
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
                        {(rec.builder.skills || []).slice(0, 3).map(s => (
                          <SkillBadge key={s} skill={s} size="xs" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Skills summary */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <h3 className="text-sm font-semibold theme-text mb-3">Your skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map(s => (
                <SkillBadge key={s} skill={s} />
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
