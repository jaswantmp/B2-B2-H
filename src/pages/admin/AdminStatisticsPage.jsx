// src/pages/admin/AdminStatisticsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  Brain, Cpu, CheckCircle2, XCircle, TrendingUp, Users, Clock,
  Calendar, Layers, Activity, RefreshCw, AlertCircle, ShieldCheck,
  Sparkles, ArrowUpRight, BarChart3, Database, Info, HelpCircle
} from 'lucide-react'
import { getAdminMLStatistics } from '../../services/api.js'

// Feature presentation metadata
const FEATURE_INFO = {
  team_matcher: {
    label: 'AI Team Matcher',
    description: 'Gradient Boosting student-builder pair & team matching engine',
    endpoint: 'POST /api/v1/ai/team-match',
    icon: Users,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20'
  },
  project_recommendations: {
    label: 'Project Recommendations',
    description: 'Gradient Boosting regression ranking project affinity for builders',
    endpoint: 'GET /api/v1/ai/project-recommendations',
    icon: Layers,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  hackathon_recommendations: {
    label: 'Hackathon Recommendations',
    description: 'Skills and domain affinity scoring for upcoming hackathons',
    endpoint: 'GET /api/v1/ai/hackathon-recommendations',
    icon: Calendar,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  },
  team_generator: {
    label: 'AI Team Generator',
    description: 'Multi-role team formation engine with pair affinity & team quality scoring',
    endpoint: 'POST /api/v1/ai/team-generator',
    icon: Sparkles,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20'
  },
  team_health: {
    label: 'Team Health',
    description: '18-feature ML team health predictor and 5-domain radar diagnostic engine',
    endpoint: 'GET /api/v1/admin/teams/{id}/health',
    icon: Activity,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

function formatMs(ms) {
  if (ms === null || ms === undefined) return '—'
  return `${Math.round(ms)} ms`
}

export default function AdminStatisticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const res = await getAdminMLStatistics()
      setData(res)
    } catch (err) {
      console.error('Failed to load ML operational analytics:', err)
      setError(err.message || 'Failed to load ML operational analytics. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 theme-divider">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight theme-text">
              ML / AI Analytics
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              Operational
            </span>
          </div>
          <p className="text-sm theme-muted">
            Operational usage, model versions, and current Team Health analytics
          </p>
        </div>

        <button
          onClick={() => fetchStats(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border theme-border hover:bg-[var(--bg-raised)] transition-all shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Stats'}
        </button>
      </div>

      {/* ─── Error Banner ──────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Unable to fetch analytics</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchStats()}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Loading Skeleton ──────────────────────────────────────── */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl border theme-divider bg-[var(--bg-surface)] p-5 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl border theme-divider bg-[var(--bg-surface)] p-6 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl border theme-divider bg-[var(--bg-surface)] p-5 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* ─── Main Content (Rendered when data loaded) ───────────────── */}
      {data && (
        <>
          {/* 1. OVERVIEW SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card: Total Requests */}
            <div className="p-5 rounded-2xl border theme-divider bg-[var(--bg-surface)] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium theme-muted uppercase tracking-wider">Total ML Requests</span>
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                  <Cpu size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold theme-text">
                  {data.overall_summary.total_requests.toLocaleString()}
                </div>
                <div className="text-xs theme-muted mt-1">
                  All production invocations
                </div>
              </div>
            </div>

            {/* Card: Successful Requests */}
            <div className="p-5 rounded-2xl border theme-divider bg-[var(--bg-surface)] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium theme-muted uppercase tracking-wider">Successful Requests</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {data.overall_summary.successful_requests.toLocaleString()}
                </div>
                <div className="text-xs theme-muted mt-1">
                  {data.overall_summary.failed_requests > 0
                    ? `${data.overall_summary.failed_requests} failed request(s)`
                    : '0 failures recorded'}
                </div>
              </div>
            </div>

            {/* Card: Success Rate */}
            <div className="p-5 rounded-2xl border theme-divider bg-[var(--bg-surface)] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium theme-muted uppercase tracking-wider">Success Rate</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold theme-text">
                  {data.overall_summary.success_rate.toFixed(1)}%
                </div>
                <div className="w-full bg-[var(--bg-raised)] rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, data.overall_summary.success_rate))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card: Unique Users */}
            <div className="p-5 rounded-2xl border theme-divider bg-[var(--bg-surface)] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium theme-muted uppercase tracking-wider">Unique Users</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold theme-text">
                  {data.overall_summary.unique_users.toLocaleString()}
                </div>
                <div className="text-xs theme-muted mt-1">
                  Students & Admins using ML
                </div>
              </div>
            </div>

            {/* Card: Average Response Time */}
            <div className="p-5 rounded-2xl border theme-divider bg-[var(--bg-surface)] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium theme-muted uppercase tracking-wider">Avg Response Time</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold theme-text">
                  {formatMs(data.overall_summary.average_response_time_ms)}
                </div>
                <div className="text-xs theme-muted mt-1">
                  Operational inference latency
                </div>
              </div>
            </div>
          </div>

          {/* 2. TIME WINDOWS (Today, 7 Days, 30 Days) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold theme-text">Usage Time Windows</h2>
                <p className="text-xs theme-muted">Operational volume across rolling activity periods</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'today', label: 'Today', period: 'Since 00:00 UTC' },
                { key: 'last_7_days', label: 'Last 7 Days', period: 'Trailing 7 days' },
                { key: 'last_30_days', label: 'Last 30 Days', period: 'Trailing 30 days' },
              ].map(({ key, label, period }) => {
                const w = data.time_windows[key] || {
                  total_requests: 0,
                  successful_requests: 0,
                  failed_requests: 0,
                  unique_users: 0
                }
                const rate = w.total_requests > 0
                  ? ((w.successful_requests / w.total_requests) * 100).toFixed(1)
                  : '0.0'

                return (
                  <div
                    key={key}
                    className="p-5 rounded-2xl border theme-divider bg-[var(--bg-surface)] shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base theme-text">{label}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-raised)] theme-muted font-medium">
                          {period}
                        </span>
                      </div>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold theme-text">{w.total_requests}</span>
                        <span className="text-xs theme-muted">requests</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t theme-divider grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs theme-muted">Success</div>
                        <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {w.successful_requests}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs theme-muted">Failed</div>
                        <div className="font-semibold text-sm text-rose-600 dark:text-rose-400 mt-0.5">
                          {w.failed_requests}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs theme-muted">Users</div>
                        <div className="font-semibold text-sm theme-text mt-0.5">
                          {w.unique_users}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. FEATURE USAGE BREAKDOWN */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold theme-text">Feature Usage Breakdown</h2>
              <p className="text-xs theme-muted">Operational volume across all 5 instrumented ML features</p>
            </div>

            <div className="rounded-2xl border theme-divider bg-[var(--bg-surface)] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg-raised)] border-b theme-divider text-xs font-semibold theme-muted uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Feature</th>
                      <th className="py-3.5 px-4 text-center">Requests</th>
                      <th className="py-3.5 px-4 text-center">Success / Fail</th>
                      <th className="py-3.5 px-4 text-center">Success Rate</th>
                      <th className="py-3.5 px-4 text-center">Unique Users</th>
                      <th className="py-3.5 px-4 text-center">Avg Latency</th>
                      <th className="py-3.5 px-4 text-right sm:pr-6">Last Invoked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-divider">
                    {data.feature_usage.map((f) => {
                      const meta = FEATURE_INFO[f.feature] || {
                        label: f.feature,
                        description: 'ML Feature',
                        icon: Brain,
                        color: 'text-violet-500',
                        bgColor: 'bg-violet-500/10'
                      }
                      const Icon = meta.icon

                      return (
                        <tr key={f.feature} className="hover:bg-[var(--bg-raised)]/50 transition-colors">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${meta.bgColor} ${meta.color} shrink-0`}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <div className="font-semibold theme-text">{meta.label}</div>
                                <div className="text-xs theme-muted line-clamp-1">{meta.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-semibold theme-text">
                            {f.total_requests}
                          </td>
                          <td className="py-4 px-4 text-center text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {f.successful_requests}
                            </span>
                            <span className="theme-muted mx-1">/</span>
                            <span className={f.failed_requests > 0 ? 'text-rose-600 dark:text-rose-400 font-medium' : 'theme-muted'}>
                              {f.failed_requests}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              f.total_requests === 0
                                ? 'bg-slate-500/10 text-slate-500'
                                : f.success_rate >= 90
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {f.success_rate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center theme-text font-medium">
                            {f.unique_users}
                          </td>
                          <td className="py-4 px-4 text-center theme-muted font-mono text-xs">
                            {formatMs(f.average_response_time_ms)}
                          </td>
                          <td className="py-4 px-4 text-right sm:pr-6 text-xs theme-muted">
                            {formatDate(f.last_used_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. TEAM HEALTH ANALYTICS & MODEL VERSIONS (Two-Column Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CURRENT TEAM HEALTH (Left column) */}
            <div className="p-6 rounded-2xl border theme-divider bg-[var(--bg-surface)] shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={20} className="text-rose-500" />
                    <h2 className="text-lg font-semibold theme-text">Current Team Health</h2>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
                    Live Diagnostics
                  </span>
                </div>
                <p className="text-xs theme-muted mt-1">
                  Live health score distribution across eligible student teams currently in the system
                </p>
              </div>

              {/* Health Score Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-raised)] border theme-divider">
                  <div className="text-xs theme-muted font-medium">Total Teams Analyzed</div>
                  <div className="text-2xl font-bold theme-text mt-1">
                    {data.team_health_analytics.total_teams}
                  </div>
                  <div className="text-[11px] theme-muted mt-0.5">Active team entities</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-raised)] border theme-divider">
                  <div className="text-xs theme-muted font-medium">Average Health Score</div>
                  <div className="text-2xl font-bold theme-text mt-1">
                    {data.team_health_analytics.average_health_score !== null
                      ? `${Math.round(data.team_health_analytics.average_health_score)}/100`
                      : '—'}
                  </div>
                  <div className="text-[11px] theme-muted mt-0.5">Calculated mean</div>
                </div>
              </div>

              {/* Health Distribution Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium theme-muted">
                  <span>Category Distribution</span>
                  <span>
                    {data.team_health_analytics.total_teams} Total Teams
                  </span>
                </div>

                {/* Progress bar visual */}
                {data.team_health_analytics.total_teams > 0 && (
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-[var(--bg-raised)]">
                    <div
                      title={`Healthy: ${data.team_health_analytics.healthy_count}`}
                      className="bg-emerald-500 transition-all"
                      style={{
                        width: `${(data.team_health_analytics.healthy_count / data.team_health_analytics.total_teams) * 100}%`
                      }}
                    />
                    <div
                      title={`Moderate: ${data.team_health_analytics.moderate_count}`}
                      className="bg-amber-500 transition-all"
                      style={{
                        width: `${(data.team_health_analytics.moderate_count / data.team_health_analytics.total_teams) * 100}%`
                      }}
                    />
                    <div
                      title={`At Risk: ${data.team_health_analytics.at_risk_count}`}
                      className="bg-rose-500 transition-all"
                      style={{
                        width: `${(data.team_health_analytics.at_risk_count / data.team_health_analytics.total_teams) * 100}%`
                      }}
                    />
                  </div>
                )}

                {/* Cards for Healthy, Moderate, At Risk */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Healthy</div>
                    <div className="text-xl font-bold theme-text mt-1">
                      {data.team_health_analytics.healthy_count}
                    </div>
                    <div className="text-[10px] theme-muted">Score ≥ 75</div>
                  </div>

                  <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Moderate</div>
                    <div className="text-xl font-bold theme-text mt-1">
                      {data.team_health_analytics.moderate_count}
                    </div>
                    <div className="text-[10px] theme-muted">Score 50–74</div>
                  </div>

                  <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center">
                    <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">At Risk</div>
                    <div className="text-xl font-bold theme-text mt-1">
                      {data.team_health_analytics.at_risk_count}
                    </div>
                    <div className="text-[10px] theme-muted">Score &lt; 50</div>
                  </div>
                </div>
              </div>
            </div>

            {/* OBSERVED MODEL VERSIONS (Right column) */}
            <div className="p-6 rounded-2xl border theme-divider bg-[var(--bg-surface)] shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={20} className="text-violet-500" />
                    <h2 className="text-lg font-semibold theme-text">Observed Model Versions</h2>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-medium">
                    Usage Logs
                  </span>
                </div>
                <p className="text-xs theme-muted mt-1">
                  Active model versions recorded during live operational inference
                </p>
              </div>

              {data.model_version_analytics.length === 0 ? (
                <div className="py-12 px-4 rounded-xl border border-dashed theme-divider text-center bg-[var(--bg-raised)]/40">
                  <Cpu size={32} className="mx-auto theme-muted opacity-40 mb-2" />
                  <p className="text-sm font-medium theme-text">No ML model usage recorded yet.</p>
                  <p className="text-xs theme-muted mt-1 max-w-sm mx-auto">
                    Live usage events will automatically appear here as students interact with AI features.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-raised)] border-b theme-divider font-semibold theme-muted uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Feature</th>
                        <th className="py-2.5 px-3">Model Version</th>
                        <th className="py-2.5 px-3 text-center">Requests</th>
                        <th className="py-2.5 px-3 text-center">Avg Latency</th>
                        <th className="py-2.5 px-3 text-right">Last Used</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y theme-divider">
                      {data.model_version_analytics.map((mv, idx) => (
                        <tr key={`${mv.feature}-${mv.model_version}-${idx}`} className="hover:bg-[var(--bg-raised)]/40">
                          <td className="py-3 px-3 font-medium theme-text">
                            {FEATURE_INFO[mv.feature]?.label || mv.feature}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-[var(--bg-raised)] border theme-divider">
                              {mv.model_version}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold theme-text">
                            {mv.request_count}
                          </td>
                          <td className="py-3 px-3 text-center font-mono theme-muted">
                            {formatMs(mv.average_response_time_ms)}
                          </td>
                          <td className="py-3 px-3 text-right theme-muted">
                            {formatDate(mv.last_used_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="text-[11px] theme-muted flex items-center gap-1.5 pt-2 border-t theme-divider">
                <Info size={13} className="shrink-0 text-violet-500" />
                <span>Aggregated directly from PostgreSQL usage log events without fabrication.</span>
              </div>
            </div>
          </div>

          {/* 5. ACTIVE MODEL REGISTRY */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold theme-text">Active Model Registry</h2>
              <p className="text-xs theme-muted">Production model configurations and underlying inference engines</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.active_models.map((m) => (
                <div
                  key={m.feature}
                  className="p-5 rounded-2xl border theme-divider bg-[var(--bg-surface)] shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm theme-text">{m.feature_name}</h3>
                      <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        m.is_tracked
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                      }`}>
                        {m.is_tracked ? 'Tracked' : 'Not tracked'}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-mono bg-[var(--bg-raised)] border theme-divider font-medium text-violet-600 dark:text-violet-400">
                        {m.model_version}
                      </span>
                    </div>

                    <p className="text-xs theme-muted mt-3 leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t theme-divider flex items-center justify-between text-[11px] theme-muted">
                    <span>Feature Key:</span>
                    <code className="font-mono text-slate-500 dark:text-slate-400">{m.feature}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
