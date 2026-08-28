import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, Trophy, Users, TrendingUp, Star, Zap, FolderOpen, ArrowRight } from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import InviteModal from '../components/InviteModal.jsx'
import { getRecommendations, getProjectRecommendations, getStudentCluster, applyProject } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'


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
        {[...new Set(builder.skills)].slice(0, 5).map(skill => (
          <SkillBadge key={skill} skill={skill} />
        ))}
        {builder.skills.length > 5 && (
          <span className="text-xs theme-muted self-center">+{builder.skills.length - 5}</span>
        )}
      </div>

      {/* Rationale */}
      <div className="rounded-xl p-3.5 mb-4 border border-violet-500/20" style={{ backgroundColor: 'var(--bg-raised)' }}>
        <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
          <Sparkles size={13} aria-hidden="true" />
          <span>MATCH REASON</span>
        </div>
        <p className="text-xs theme-text-secondary">{reason}</p>

        {fitAreas && fitAreas.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs theme-muted font-medium">Fit Areas:</span>
            {fitAreas.map(area => (
              <span
                key={area}
                className={`px-2 py-0.5 rounded-md text-xs border ${FIT_COLORS[area] || 'bg-violet-100 text-violet-800 font-semibold'}`}
              >
                {area}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t theme-divider flex-wrap gap-2">
        <span className="text-xs theme-muted flex items-center gap-1">
          <Trophy size={12} className="text-amber-500" />
          Targeting: <strong className="theme-text font-medium">{hackathon}</strong>
        </span>
        <button
          onClick={() => onInvite(builder)}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Zap size={13} /> Invite to Team
        </button>
      </div>
    </article>
  )
}

function ProjectRecCard({ rec }) {
  const { toast } = useToast()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  const { project, match_score, matched_skills, match_reasons } = rec
  const score = match_score ?? 80

  const handleApply = async () => {
    setApplying(true)
    try {
      await applyProject(project.id, { role: project.open_roles?.[0] || 'Developer' })
      setApplied(true)
      toast?.('Application submitted successfully!', 'success')
    } catch (e) {
      console.error(e)
      toast?.('Failed to submit application', 'error')
    } finally {
      setApplying(false)
    }
  }

  return (
    <article
      className="rounded-2xl p-5 border hover:border-violet-500/50 transition-all duration-200"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              {project.category}
            </span>
            <span className="text-xs theme-muted">•</span>
            <span className="text-xs theme-muted">{project.university}</span>
          </div>
          <h3 className="font-bold theme-text text-lg leading-snug">{project.title}</h3>
        </div>
        <ScoreRing score={score} />
      </div>

      <p className="text-xs theme-muted line-clamp-2 mb-4 leading-relaxed">{project.description}</p>

      {/* Tech stack & matched skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(project.tech || []).map(t => {
          const isMatched = (matched_skills || []).includes(t)
          return (
            <span
              key={t}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isMatched
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-semibold'
                  : 'bg-surface-raised theme-text-secondary border-subtle'
              }`}
            >
              {t} {isMatched && '✓'}
            </span>
          )
        })}
      </div>

      {/* Match Reasons */}
      <div className="rounded-xl p-4 mb-4 border border-violet-400 dark:border-violet-800/30" style={{ backgroundColor: 'var(--bg-raised)' }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={13} className="text-violet-800 dark:text-violet-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold text-violet-800 dark:text-violet-400 uppercase tracking-wide">
            Why this project is recommended for you
          </span>
        </div>
        <ul className="space-y-1 text-xs theme-text-secondary list-disc list-inside">
          {(match_reasons || []).map((r, idx) => (
            <li key={idx}>{r}</li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t theme-divider">
        <div className="flex items-center gap-2">
          <PulseAvatar user={project.creator} size="xs" />
          <span className="text-xs theme-muted">By {project.creator?.name || 'Project Lead'}</span>
        </div>
        <button
          onClick={handleApply}
          disabled={applying || applied}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {applying ? 'Applying...' : applied ? 'Applied' : 'Apply to Project'} <ArrowRight size={12} />
        </button>
      </div>
    </article>
  )
}

export default function RecommendationsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab]   = useState('builders')
  const [inviteUser, setInviteUser] = useState(null)
  const [dismissed, setDismissed]   = useState([])
  const [recs, setRecs] = useState([])
  const [projectRecs, setProjectRecs] = useState([])
  const [studentCluster, setStudentCluster] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getRecommendations().catch(err => {
        console.warn('Failed to load builder recommendations:', err)
        return []
      }),
      getProjectRecommendations().catch(err => {
        console.warn('Failed to load project recommendations:', err)
        return { recommendations: [] }
      }),
      getStudentCluster().catch(err => {
        console.warn('Failed to load student cluster:', err)
        return null
      })
    ]).then(([bData, pData, clusterData]) => {
      setRecs(bData || [])
      setProjectRecs(pData?.recommendations || [])
      setStudentCluster(clusterData)
      setLoading(false)
    })
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
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Sparkles size={22} className="text-violet-600 dark:text-violet-400" aria-hidden="true" />
            <h1 className="text-2xl font-bold theme-text">AI Recommendations</h1>
          </div>
          <p className="theme-muted text-sm">
            Personalized builder and project recommendations for <span className="theme-text font-medium">{user?.name ?? 'you'}</span>.
          </p>
        </div>
      </div>

      {/* AI Skill Cluster Profile Banner */}
      {studentCluster && (
        <div
          className="rounded-2xl p-5 mb-6 border border-violet-500/40 relative overflow-hidden shadow-lg transition-all"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-600/15 text-violet-600 dark:text-violet-300 border border-violet-500/30 flex items-center gap-1">
                  <Zap size={12} className="text-violet-500" />
                  AI SKILL CLUSTER
                </span>
                <span className="text-xs theme-muted">K-Means Model (K=4)</span>
              </div>
              <h2 className="text-xl font-bold theme-text leading-tight flex items-center gap-2">
                {studentCluster.segment_name}
              </h2>
              <p className="text-xs theme-muted mt-1.5 leading-relaxed">
                {studentCluster.explanation}
              </p>

              {/* Dominant Skills & Domains */}
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                {studentCluster.dominant_skills?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold theme-muted">Dominant Skills:</span>
                    {studentCluster.dominant_skills.map((s, idx) => (
                      <SkillBadge key={idx} skill={s} />
                    ))}
                  </div>
                )}
                {studentCluster.dominant_domains?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold theme-muted">Dominant Domains:</span>
                    {studentCluster.dominant_domains.map((d, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Confidence Ring Box */}
            <div className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-violet-500/20 bg-violet-500/5 min-w-[120px] text-center">
              <span className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
                {Math.round((studentCluster.confidence || 0.85) * 100)}%
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider theme-muted mt-0.5">
                Cluster Fit
              </span>
              <span className="text-[10px] theme-muted mt-1">
                Distance: {studentCluster.centroid_distance ?? '1.2'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex rounded-xl p-1 border theme-divider mb-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <button
            onClick={() => setActiveTab('builders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'builders'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'theme-muted hover:theme-text'
            }`}
          >
            <Users size={14} /> Builder Matches ({visible.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'projects'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'theme-muted hover:theme-text'
            }`}
          >
            <FolderOpen size={14} /> Project Matches ({projectRecs.length})
          </button>
        </div>

      {activeTab === 'builders' ? (
        <>
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
            </p>
          </div>

          {/* Cards */}
          {visible.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles size={32} className="theme-muted mx-auto mb-3" />
              <p className="theme-text font-medium mb-1">No active builder recommendations</p>
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
        </>
      ) : (
        <>
          {/* Disclaimer for Projects */}
          <div
            className="flex items-start gap-3 rounded-xl p-4 mb-6 border border-violet-400 dark:border-violet-800/30"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            <Sparkles size={15} className="text-violet-800 dark:text-violet-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm theme-text-secondary leading-relaxed">
              Project recommendations use <span className="text-violet-800 dark:text-violet-400 font-medium">Gradient Boosting & TF-IDF similarity</span> to score projects matching your skills, academic background, and interests.
            </p>
          </div>

          {/* Project Recommendation Cards */}
          {projectRecs.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen size={32} className="theme-muted mx-auto mb-3" />
              <p className="theme-text font-medium mb-1">No project recommendations found</p>
              <p className="theme-muted text-sm">Update your profile skills and domain interests to see recommended projects.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {projectRecs.map((rec, idx) => (
                <ProjectRecCard key={rec.project?.id || idx} rec={rec} />
              ))}
            </div>
          )}
        </>
      )}

      {inviteUser && <InviteModal user={inviteUser} onClose={() => setInviteUser(null)} />}
    </div>
  )
}

