// src/pages/GeneratorPage.jsx
import { useState } from 'react'
import {
  Zap, Sparkles, Send, RotateCcw, CheckCircle,
  ChevronDown, ChevronUp, UserPlus, Lightbulb,
} from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import InviteModal from '../components/InviteModal.jsx'
import { generateTeam } from '../services/api.js'

const SKILL_OPTIONS = [
  'React', 'Vue.js', 'Node.js', 'Python', 'Go', 'Rust',
  'TensorFlow', 'PyTorch', 'LangChain', 'FastAPI',
  'PostgreSQL', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'AWS',
  'Figma', 'UI/UX', 'Product Management',
  'Solidity', 'Web3', 'Flutter',
]

const TEAM_SIZES = [2, 3, 4, 5, 6]

const EXAMPLE_IDEAS = [
  'An AI-powered mental health chatbot for college students',
  'A decentralized credential verification platform using blockchain',
  'A smart campus energy monitoring system with IoT sensors',
  'A multilingual voice assistant for rural healthcare workers',
  'An automated peer code review tool powered by LLMs',
]

const MATCH_SCORES = [96, 91, 88, 84]

function RoleCard({ role, index }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-strong)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:opacity-90 transition-opacity"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-400 dark:border-violet-800/40 flex items-center justify-center text-xs font-bold text-violet-800 dark:text-violet-400 flex-shrink-0">
            {index + 1}
          </span>
          <div>
            <p className="font-semibold text-sm theme-text">{role.role}</p>
            <p className="text-xs theme-muted line-clamp-1">{role.reason}</p>
          </div>
        </div>
        {open
          ? <ChevronUp size={15} className="theme-muted flex-shrink-0" />
          : <ChevronDown size={15} className="theme-muted flex-shrink-0" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="text-sm theme-muted leading-relaxed pt-3">{role.reason}</p>
          <div>
            <p className="text-xs font-semibold theme-muted uppercase tracking-wider mb-2">Key Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {role.skills.map(s => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-md border font-medium"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BuilderMatchCard({ builder, score, onInvite }) {
  const scoreColor = score >= 90 ? 'text-emerald-800 dark:text-emerald-400' : score >= 80 ? 'text-amber-800 dark:text-amber-400' : 'text-cyan-800 dark:text-cyan-400'
  const scoreBg    = score >= 90 ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-400 dark:border-emerald-800/40 font-semibold' : score >= 80 ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-800/40 font-semibold' : 'bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-400 dark:border-cyan-800/40 font-semibold'

  return (
    <div
      className="rounded-xl border p-4 hover:border-violet-500/50 transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex items-start gap-3">
        <PulseAvatar user={builder} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-semibold text-sm theme-text">{builder.name}</p>
              <p className="text-xs theme-muted">{builder.branch} · {builder.university}</p>
            </div>
            <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${scoreColor} ${scoreBg}`}>
              {score}%
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {builder.skills.slice(0, 3).map(s => (
              <SkillBadge key={s} skill={s} verified={builder.verifiedSkills?.includes(s)} size="xs" />
            ))}
            {builder.skills.length > 3 && (
              <span className="text-xs theme-muted self-center">+{builder.skills.length - 3}</span>
            )}
          </div>

          <button
            onClick={() => onInvite(builder)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
          >
            <UserPlus size={12} /> Invite
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GeneratorPage() {
  const [idea, setIdea]               = useState('')
  const [selectedSkills, setSelected] = useState([])
  const [teamSize, setTeamSize]       = useState(4)
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState(null)
  const [inviteUser, setInviteUser]   = useState(null)
  const [error, setError]             = useState('')

  const toggleSkill = skill =>
    setSelected(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )

  const handleGenerate = async () => {
    if (!idea.trim()) { setError('Please describe your project idea.'); return }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const data = await generateTeam(idea.trim())
      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setIdea('')
    setSelected([])
    setTeamSize(4)
    setResult(null)
    setError('')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Zap size={22} className="text-violet-400" aria-hidden="true" />
          <h1 className="text-2xl font-bold theme-text">AI Team Generator</h1>
        </div>
        <p className="theme-muted text-sm">
          Describe your project idea. Our AI will suggest the ideal team composition and match you with builders who fit each role.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Input form ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Idea input */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <label htmlFor="project-idea" className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-2">
                Project Idea <span className="text-red-400">*</span>
              </label>
              <textarea
                id="project-idea"
                value={idea}
                onChange={e => { setIdea(e.target.value); setError('') }}
                rows={4}
                placeholder="e.g. An AI-powered healthcare app that helps rural doctors diagnose patients using smartphone cameras..."
                className="theme-input w-full px-3 py-2.5 text-sm resize-none"
                aria-describedby="idea-error"
              />
              {error && (
                <p id="idea-error" className="text-xs text-red-400 mt-1">{error}</p>
              )}
            </div>

            {/* Example ideas */}
            <div>
              <p className="text-xs font-medium theme-muted flex items-center gap-1.5 mb-2">
                <Lightbulb size={12} /> Example ideas
              </p>
              <div className="space-y-1.5">
                {EXAMPLE_IDEAS.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setIdea(ex)}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-all theme-muted hover:text-violet-400"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Team size */}
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <label className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-3">
              Team Size
            </label>
            <div className="flex gap-2">
              {TEAM_SIZES.map(n => (
                <button
                  key={n}
                  onClick={() => setTeamSize(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                    teamSize === n
                      ? 'bg-violet-700 border-violet-500 text-white'
                      : 'theme-btn-ghost'
                  }`}
                  aria-pressed={teamSize === n}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Required skills */}
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <label className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-3">
              Must-Have Skills (optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map(skill => {
                const active = selectedSkills.includes(skill)
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                      active ? 'bg-violet-700 border-violet-500 text-white' : 'theme-btn-ghost'
                    }`}
                    aria-pressed={active}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
            {selectedSkills.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="text-xs theme-muted hover:text-red-400 mt-3 transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || !idea.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Generate Team
                </>
              )}
            </button>
            {result && (
              <button
                onClick={handleReset}
                className="px-4 py-3 rounded-xl theme-btn-ghost text-sm font-medium transition-colors"
                aria-label="Start over"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-3">
          {/* Empty / loading state */}
          {!result && !loading && (
            <div
              className="rounded-2xl border h-full flex flex-col items-center justify-center py-20 text-center px-6"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="w-16 h-16 rounded-2xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center mx-auto mb-4">
                <Zap size={28} className="text-violet-400" />
              </div>
              <h2 className="font-bold theme-text mb-2">Your team blueprint will appear here</h2>
              <p className="theme-muted text-sm max-w-xs leading-relaxed">
                Describe your project idea and click Generate Team to get AI-matched roles and builder recommendations.
              </p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div
              className="rounded-2xl border p-6 space-y-4"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                <span className="text-sm text-violet-400 font-medium">Analysing your idea and matching builders...</span>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="theme-skeleton h-14 animate-pulse rounded-xl" aria-hidden="true" />
              ))}
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-5">
              {/* Idea summary */}
              <div
                className="rounded-2xl border p-4 border-violet-800/40"
                style={{ backgroundColor: 'var(--bg-raised)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">Team blueprint generated</span>
                </div>
                <p className="text-sm theme-muted leading-relaxed italic">
                  "{result.idea}"
                </p>
              </div>

              {/* Recommended roles */}
              <div>
                <h2 className="text-xs font-semibold theme-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles size={13} className="text-violet-400" />
                  Recommended Roles ({result.roles.length})
                </h2>
                <div className="space-y-2">
                  {result.roles.map((role, i) => (
                    <RoleCard key={role.role} role={role} index={i} />
                  ))}
                </div>
              </div>

              {/* Matched builders */}
              <div>
                <h2 className="text-xs font-semibold theme-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Send size={13} className="text-cyan-400" />
                  Matched Builders ({result.suggestedBuilders.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.suggestedBuilders.map((builder, i) => (
                    <BuilderMatchCard
                      key={builder.id}
                      builder={builder}
                      score={MATCH_SCORES[i] ?? 80}
                      onInvite={setInviteUser}
                    />
                  ))}
                </div>
              </div>

              {/* Regenerate hint */}
              <p className="text-xs theme-muted text-center">
                Not quite right?{' '}
                <button onClick={handleReset} className="text-violet-400 hover:text-violet-300 transition-colors">
                  Refine your idea
                </button>{' '}
                and generate again.
              </p>
            </div>
          )}
        </div>
      </div>

      {inviteUser && <InviteModal user={inviteUser} onClose={() => setInviteUser(null)} />}
    </div>
  )
}
