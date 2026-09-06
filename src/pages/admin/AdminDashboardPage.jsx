// src/pages/admin/AdminDashboardPage.jsx
import { useState, useEffect } from 'react'
import {
  Users, UserCheck, ShieldAlert, FolderOpen, UsersRound,
  Calendar, Award, RefreshCw, AlertCircle, Sparkles, Activity
} from 'lucide-react'
import { getAdminStats } from '../../services/api.js'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminStats()
      setStats(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load admin stats:', err)
      setError(err?.message || 'Failed to load administrative statistics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statCards = stats ? [
    {
      label: 'Total Students',
      value: stats.total_students,
      icon: Users,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      description: 'Registered platform accounts',
    },
    {
      label: 'Active Students',
      value: stats.active_students,
      icon: Activity,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      description: 'Currently active student profiles',
    },
    {
      label: 'Verified Students',
      value: stats.verified_students,
      icon: UserCheck,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      description: 'Profiles with verified skills',
    },
    {
      label: 'Projects',
      value: stats.total_projects,
      icon: FolderOpen,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      description: 'Student collaboration workspaces',
    },
    {
      label: 'Teams Formed',
      value: stats.total_teams,
      icon: UsersRound,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      description: 'Active hackathon team rosters',
    },
    {
      label: 'Hackathons',
      value: stats.total_hackathons,
      icon: Calendar,
      color: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      description: 'Cataloged hackathon events',
    },
    {
      label: 'Hackathon Registrations',
      value: stats.total_hackathon_registrations,
      icon: Award,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      description: 'Total student event enrollments',
    },
  ] : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold theme-text tracking-tight">Admin Dashboard</h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-700/50">
              Phase 1: Foundation
            </span>
          </div>
          <p className="theme-muted text-sm mt-1">
            Real-time platform metrics and administrative overview directly from the database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs theme-muted hidden sm:inline">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border theme-divider hover:border-violet-500/50 text-sm font-medium transition-all"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-violet-500' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Unable to fetch metrics</p>
            <p className="opacity-90">{error}</p>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div
              key={i}
              className="p-5 rounded-2xl border theme-divider animate-pulse space-y-3"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-36" />
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold theme-muted uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg} border ${card.border}`}>
                    <Icon size={18} className={card.color} />
                  </div>
                </div>

                <div className="text-3xl font-extrabold theme-text tracking-tight">
                  {card.value.toLocaleString()}
                </div>

                <p className="text-xs theme-muted mt-2">
                  {card.description}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* System Security & Architecture Status */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-violet-500" />
          <h2 className="text-sm font-bold theme-text uppercase tracking-wider">
            Admin Foundation Status
          </h2>
        </div>
        <p className="text-sm theme-muted leading-relaxed mb-4">
          The Admin Control Center is operating with strict database-backed authorization.
          Administrative privileges are verified on every API request via the PostgreSQL user record.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border theme-divider bg-[var(--bg-raised)]">
            <span className="text-violet-600 dark:text-violet-400 font-bold block mb-1">Backend Enforced</span>
            <span className="theme-muted leading-snug block">
              Direct API calls from unauthenticated clients or students return HTTP 403 Forbidden.
            </span>
          </div>
          <div className="p-3.5 rounded-xl border theme-divider bg-[var(--bg-raised)]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold block mb-1">Live Database State</span>
            <span className="theme-muted leading-snug block">
              Stats reflect live table rows without caching or hardcoded synthetic data.
            </span>
          </div>
          <div className="p-3.5 rounded-xl border theme-divider bg-[var(--bg-raised)]">
            <span className="text-cyan-600 dark:text-cyan-400 font-bold block mb-1">ML Pipeline Safe</span>
            <span className="theme-muted leading-snug block">
              Underlying models and recommender pipelines operate on the shared database schema.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
