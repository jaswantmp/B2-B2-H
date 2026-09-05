// src/pages/AITeamMatcherPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, UserCheck, MapPin, Trophy, Check, ArrowRight, RefreshCw, AlertCircle, Cpu } from 'lucide-react'
import { generateTeamMatches, getAIUsage, explainTeamMatch } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import PulseAvatar from '../components/PulseAvatar.jsx'
import InviteModal from '../components/InviteModal.jsx'

export default function AITeamMatcherPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteUser, setInviteUser] = useState(null)
  const [usage, setUsage] = useState(null)
  const [explainingId, setExplainingId] = useState(null)

  if (user && user.onboarding_completed === false) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl min-h-[70vh] flex flex-col items-center justify-center text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center mx-auto">
          <Sparkles className="text-violet-400 animate-pulse" size={28} />
        </div>
        <h2 className="text-2xl font-bold theme-text">AI Matchmaking is Locked</h2>
        <p className="theme-muted text-sm max-w-md leading-relaxed">
          You must complete your profile onboarding before accessing AI-powered team recommendations.
        </p>
        <Link
          to="/onboarding"
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2"
        >
          Complete Onboarding
          <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  useEffect(() => {
    fetchMatches()
    fetchUsage()
  }, [user])

  const fetchUsage = async () => {
    if (!user) return
    try {
      const res = await getAIUsage()
      setUsage(res)
    } catch (e) {
      console.error("Failed to fetch AI usage stats:", e)
    }
  }

  const fetchMatches = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError('')
      const response = await generateTeamMatches(user.id)
      setMatches(response.matches || [])
    } catch (err) {
      console.error(err)
      let errMsg = 'Failed to load team matches. Please verify your server connection and try again.'
      if (err.body && err.body.detail) {
        errMsg = err.body.detail
      }
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestExplanation = async (targetUserId) => {
    setExplainingId(targetUserId)
    try {
      const res = await explainTeamMatch(targetUserId)
      setMatches(prev =>
        prev.map(m =>
          m.user_id === targetUserId ? { ...m, ai_explanation: res.ai_explanation } : m
        )
      )
    } catch (err) {
      console.error(err)
      let errMsg = "Failed to load explanation."
      if (err.body && err.body.detail) {
        errMsg = err.body.detail
      } else if (err.message) {
        errMsg = err.message
      }

      if (
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("unavailable") ||
        errMsg.toLowerCase().includes("limit reached")
      ) {
        setMatches(prev =>
          prev.map(m =>
            m.user_id === targetUserId
              ? {
                  ...m,
                  ai_explanation:
                    "⚠️ AI service temporarily unavailable.\n\nThe AI quota has been reached.\nPlease try again later."
                }
              : m
          )
        )
      } else {
        setMatches(prev =>
          prev.map(m =>
            m.user_id === targetUserId ? { ...m, ai_explanation: `Error: ${errMsg}` } : m
          )
        )
      }
    } finally {
      setExplainingId(null)
      fetchUsage()
    }
  }

  const getProgressColor = (score) => {
    if (score >= 90) return 'bg-emerald-500'
    if (score >= 80) return 'bg-amber-500'
    return 'bg-cyan-500'
  }

  const getScoreTextColor = (score) => {
    if (score >= 90) return 'text-emerald-800 dark:text-emerald-400'
    if (score >= 80) return 'text-amber-800 dark:text-amber-400'
    return 'text-cyan-800 dark:text-cyan-400'
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <UserCheck size={24} className="text-violet-400" aria-hidden="true" />
            <h1 className="text-2xl font-bold theme-text">AI Team Matcher</h1>
          </div>
          <p className="theme-muted text-sm max-w-xl">
            Recommends the best teammates based on skill compatibility (similarity & complementarity), academic year, branch, and status.
          </p>
          {usage && usage.team_matcher && (
            <div className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 border border-violet-400/40 dark:border-violet-800/40 text-violet-800 dark:text-violet-300 inline-block">
              <Sparkles size={11} className="inline mr-1" /> {usage.team_matcher.remaining} / {usage.team_matcher.limit} remaining today
            </div>
          )}
        </div>
        <button
          onClick={fetchMatches}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border theme-divider hover:border-violet-500/40 text-sm font-medium transition-all"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-violet-400' : ''} />
          {loading ? 'Analyzing Compatibility...' : 'Find Matches'}
        </button>
      </div>
 
      {/* Matching Criteria Banner */}
      <div
        className="flex items-start gap-3.5 rounded-2xl p-5 mb-8 border border-violet-400 dark:border-violet-800/30 shadow-lg"
        style={{ backgroundColor: 'var(--bg-raised)' }}
      >
        <Sparkles size={20} className="text-violet-800 dark:text-violet-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wider mb-1">Matching Algorithm Active</h2>
          <p className="text-sm theme-text-secondary leading-relaxed">
            Our engine checks for both <span className="text-violet-800 dark:text-violet-400 font-semibold">Skill Similarity</span> (matching overlapping stacks) and <span className="text-violet-800 dark:text-violet-400 font-semibold">Skill Complementarity</span> (pairing builders with different but matching roles like Frontend + Backend + AI) to form balanced hackathon teams.
          </p>
        </div>
      </div>
  
      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-violet-800/30 bg-violet-950/10 text-violet-400 font-semibold animate-pulse text-sm">
            <span className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
            <span>Calculating compatibility scores and generating AI insights...</span>
          </div>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-2xl border theme-divider p-6 space-y-4 animate-pulse"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <div className="flex gap-4 items-start">
                <div className="w-14 h-14 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-slate-800 rounded w-1/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
                <div className="w-12 h-12 bg-slate-800 rounded-lg" />
              </div>
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-16 bg-slate-800/60 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-16 rounded-2xl border border-red-500/20 bg-red-950/10 p-6">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h3 className="font-semibold text-base theme-text mb-1">Matching Error</h3>
          {error.includes("quota") || error.includes("exhausted") || error.includes("limit reached") ? (
            <div className="text-sm text-amber-500 font-medium max-w-sm mx-auto mb-4 whitespace-pre-line">
              ⚠️ AI service temporarily unavailable.
              {"\n"}The AI quota has been reached.
              {"\n"}Please try again later.
            </div>
          ) : (
            <p className="text-sm theme-muted max-w-sm mx-auto mb-4">{error}</p>
          )}
          <button
            onClick={fetchMatches}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && matches.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-dashed theme-divider bg-[var(--bg-raised)]/20">
          <UserCheck size={40} className="theme-muted mx-auto mb-3 opacity-55" />
          <p className="theme-text font-semibold mb-1">No matches found</p>
          <p className="theme-muted text-sm max-w-xs mx-auto">
            We couldn't find other builders matching your profile criteria right now. Check back after updating your skills!
          </p>
          <Link
            to="/settings?tab=skills"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-violet-400 hover:text-violet-300 font-semibold"
          >
            Manage Your Skills <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Matches List */}
      {!loading && !error && matches.length > 0 && (
        <div className="space-y-6">
          {matches.map(candidate => (
            <article
              key={candidate.user_id}
              className="rounded-2xl p-6 border hover:border-violet-500/40 hover:shadow-xl transition-all duration-200"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              {/* Profile details */}
              <div className="flex flex-col sm:flex-row gap-4 items-start mb-5">
                <PulseAvatar user={candidate} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold theme-text text-lg leading-snug">{candidate.name}</h3>
                      <p className="text-sm theme-muted mt-0.5">
                        {candidate.branch} · {candidate.year} · {candidate.university}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-black ${getScoreTextColor(candidate.compatibility_score)}`}>
                        ⭐ {candidate.compatibility_score}%
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 dark:text-violet-400">
                        {candidate.compatibility_level || 'Compatible'}
                      </span>
                    </div>
                  </div>

                  {/* Recommended role badge */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs theme-muted">Suggested Role:</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-lg border border-violet-400 dark:border-violet-800/40 bg-violet-100 dark:bg-violet-950/20 text-violet-800 dark:text-violet-400 font-semibold">
                      {candidate.recommended_role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-xs">
                {/* Common Skills */}
                <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
                  <div className="font-bold text-violet-700 dark:text-violet-300 mb-1.5 flex items-center gap-1">
                    <Check size={12} className="text-violet-500" /> Common Skills
                  </div>
                  {candidate.common_skills && candidate.common_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {candidate.common_skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-800 dark:text-violet-300 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="theme-muted italic">None shared</span>
                  )}
                </div>

                {/* Complementary Skills */}
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 mb-1.5 flex items-center gap-1">
                    <Sparkles size={12} className="text-emerald-500" /> Complementary Skills
                  </div>
                  {candidate.complementary_skills && candidate.complementary_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {candidate.complementary_skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="theme-muted italic">Full stack overlap</span>
                  )}
                </div>

                {/* Common Domains */}
                <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                  <div className="font-bold text-cyan-700 dark:text-cyan-300 mb-1.5 flex items-center gap-1">
                    <Cpu size={12} className="text-cyan-500" /> Common Domains
                  </div>
                  {candidate.common_domains && candidate.common_domains.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {candidate.common_domains.map((d, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 font-medium">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="theme-muted italic">General alignment</span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5 space-y-1.5">
                <div className="flex justify-between text-xs theme-muted">
                  <span>Match Strength</span>
                  <span>{candidate.compatibility_score}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800/60 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(candidate.compatibility_score)}`}
                    style={{ width: `${candidate.compatibility_score}%` }}
                  />
                </div>
              </div>

              {/* AI Match Insights card */}
              <div
                className="rounded-xl p-4 mb-5 border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-violet-400" />
                  <h4 className="text-xs font-bold theme-text uppercase tracking-wider">
                    AI Match Insights
                  </h4>
                </div>
                <hr className="theme-divider border-t my-2" style={{ borderColor: 'var(--border-subtle)' }} />
                
                {candidate.ai_explanation ? (
                  <p className="text-sm theme-text-secondary leading-relaxed whitespace-pre-line">
                    {candidate.ai_explanation}
                  </p>
                ) : (
                  <div className="text-center py-2">
                    <button
                      onClick={() => handleRequestExplanation(candidate.user_id)}
                      disabled={explainingId !== null}
                      className="px-4 py-2 bg-violet-600/80 hover:bg-violet-600 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {explainingId === candidate.user_id ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing Match...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Request AI Insight
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ML Insights section (rendered if any ML field is available) */}
              {(candidate.ml_score != null ||
                candidate.probability_good_fit != null ||
                candidate.predicted_compatibility != null ||
                candidate.cluster_segment != null ||
                candidate.model_version != null) && (
                <div
                  className="rounded-xl p-4 mb-5 border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-violet-400" />
                      <h4 className="text-xs font-bold theme-text uppercase tracking-wider">
                        ML Insights
                      </h4>
                    </div>
                    {candidate.model_version != null && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-700/40 font-medium">
                        {candidate.model_version.replace(/[-_]v[\d.]+$/i, '')}
                      </span>
                    )}
                  </div>
                  <hr className="theme-divider border-t my-2" style={{ borderColor: 'var(--border-subtle)' }} />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                    {candidate.ml_score != null && (
                      <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 text-center">
                        <div className="text-[10px] uppercase font-semibold text-violet-700 dark:text-violet-400/80 tracking-wider">
                          ML Score
                        </div>
                        <div className="text-base font-extrabold text-violet-900 dark:text-violet-300 mt-0.5">
                          {Number(candidate.ml_score).toFixed(1)}
                        </div>
                      </div>
                    )}
                    {candidate.probability_good_fit != null && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center">
                        <div className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400/80 tracking-wider">
                          Good Fit Prob
                        </div>
                        <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {(Number(candidate.probability_good_fit) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {candidate.predicted_compatibility != null && (
                      <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 text-center">
                        <div className="text-[10px] uppercase font-semibold text-cyan-700 dark:text-cyan-400/80 tracking-wider">
                          Predicted Compat
                        </div>
                        <div className="text-base font-extrabold text-cyan-700 dark:text-cyan-400 mt-0.5">
                          {Number(candidate.predicted_compatibility).toFixed(1)}
                        </div>
                      </div>
                    )}
                    {candidate.cluster_segment != null && (
                      <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 text-center flex flex-col justify-center col-span-2 sm:col-span-1">
                        <div className="text-[10px] uppercase font-semibold text-violet-700 dark:text-violet-400/80 tracking-wider">
                          Student Segment
                        </div>
                        <div className="text-xs font-bold text-violet-900 dark:text-violet-200 mt-0.5 truncate" title={candidate.cluster_segment}>
                          {candidate.cluster_segment}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Match reasons check list */}
              {candidate.reasons && candidate.reasons.length > 0 && (
                <div
                  className="rounded-xl p-4 mb-5 border theme-divider"
                  style={{ backgroundColor: 'var(--bg-raised)' }}
                >
                  <h4 className="text-xs font-bold theme-text-secondary uppercase tracking-widest mb-2.5">
                    Match Explanation
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="list">
                    {candidate.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm theme-text-secondary leading-snug">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={10} className="text-emerald-400" aria-hidden="true" />
                        </span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t theme-divider">
                <button
                  onClick={() => setInviteUser(candidate)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                >
                  Send Invite
                </button>
                <Link
                  to={`/builders/${candidate.user_id}`}
                  className="px-5 py-2.5 rounded-xl border theme-divider hover:bg-[var(--bg-raised)] text-sm font-medium transition-all text-center"
                >
                  View Profile
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {inviteUser && (
        <InviteModal
          user={inviteUser}
          onClose={() => setInviteUser(null)}
        />
      )}
    </div>
  )
}
