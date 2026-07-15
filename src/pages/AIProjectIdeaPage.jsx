// src/pages/AIProjectIdeaPage.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, Sparkles, Code2, Users, Lightbulb, Plus, X, AlertCircle, RefreshCw, Cpu, ArrowRight
} from 'lucide-react'
import { generateProjectIdea } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const SUGGESTED_DOMAINS = [
  'Education',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Sustainability',
]

const POPULAR_SKILLS = [
  'Python', 'React', 'AI', 'FastAPI', 'PostgreSQL', 'Tailwind CSS', 'Node.js', 'TypeScript'
]

export default function AIProjectIdeaPage() {
  const { user } = useAuth()
  const [domain, setDomain] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  if (user && user.onboarding_completed === false) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl min-h-[70vh] flex flex-col items-center justify-center text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center mx-auto">
          <Brain className="text-violet-400 animate-pulse" size={28} />
        </div>
        <h2 className="text-2xl font-bold theme-text">AI Project Blueprint Generator is Locked</h2>
        <p className="theme-muted text-sm max-w-md leading-relaxed">
          You must complete your profile onboarding before generating custom hackathon project blueprints.
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

  const handleAddSkill = (skill) => {
    const trimmed = skill.trim()
    if (!trimmed) return
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
    }
    setSkillInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill(skillInput)
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleTogglePopularSkill = (skill) => {
    if (skills.includes(skill)) {
      handleRemoveSkill(skill)
    } else {
      setSkills([...skills, skill])
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!domain.trim()) {
      setError('Please provide a domain.')
      return
    }
    if (skills.length === 0) {
      setError('Please add at least one skill.')
      return
    }
    
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const data = await generateProjectIdea(domain.trim(), skills)
      setResult(data)
    } catch (err) {
      setError('Failed to generate project idea. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setDomain('')
    setSkills([])
    setSkillInput('')
    setResult(null)
    setError('')
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Brain size={24} className="text-violet-400" aria-hidden="true" />
          <h1 className="text-2xl font-bold theme-text">AI Project Idea Generator</h1>
        </div>
        <p className="theme-muted text-sm">
          Select a domain and add skills to generate a comprehensive project blueprint with recommended tech stacks and team roles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Generator Configuration Form */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Domain input */}
            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <label htmlFor="domain" className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-2">
                  Target Domain <span className="text-red-400">*</span>
                </label>
                <input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={e => { setDomain(e.target.value); setError('') }}
                  placeholder="e.g. Education, Healthcare, Finance..."
                  className="theme-input w-full px-3 py-2.5 text-sm"
                  required
                />
              </div>

              {/* Suggested domains */}
              <div>
                <p className="text-xs font-medium theme-muted flex items-center gap-1.5 mb-2">
                  <Lightbulb size={12} /> Suggested Domains
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_DOMAINS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { setDomain(d); setError('') }}
                      className={`text-xs px-2.5 py-1.5 rounded-lg transition-all border ${
                        domain === d
                          ? 'bg-violet-100 dark:bg-violet-950/40 border-violet-400 dark:border-violet-700/50 text-violet-800 dark:text-violet-400 font-semibold'
                          : 'theme-btn-ghost hover:text-violet-400'
                      }`}
                      style={domain !== d ? { backgroundColor: 'var(--bg-raised)' } : {}}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills selection */}
            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <label htmlFor="skills" className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-2">
                  Team Skills / Tech Interests <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="skills"
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a skill and press Enter"
                    className="theme-input flex-1 px-3 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skillInput)}
                    className="p-2.5 rounded-xl border theme-btn-ghost flex items-center justify-center transition-all"
                    style={{ borderColor: 'var(--border-strong)' }}
                    aria-label="Add skill"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Skills selected list */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border font-semibold bg-violet-100 dark:bg-violet-900/30 border-violet-400 dark:border-violet-800/40 text-violet-800 dark:text-violet-400"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="hover:text-red-400 transition-colors"
                        aria-label={`Remove ${s}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Popular skills recommendations */}
              <div>
                <p className="text-xs font-medium theme-muted flex items-center gap-1.5 mb-2">
                  Popular Skills Suggestions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.map(skill => {
                    const active = skills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleTogglePopularSkill(skill)}
                        className={`text-xs px-2 py-1 rounded-md border transition-all ${
                          active
                            ? 'bg-violet-100 dark:bg-violet-950/40 border-violet-400 dark:border-violet-700/50 text-violet-800 dark:text-violet-400 font-semibold'
                            : 'theme-btn-ghost'
                        }`}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/50 p-3 rounded-xl">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !domain.trim() || skills.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> Generate Idea
                  </>
                )}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 rounded-xl theme-btn-ghost text-sm font-medium transition-colors"
                  aria-label="Start over"
                >
                  <RefreshCw size={15} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Results Display */}
        <div className="lg:col-span-3">
          {/* Empty state */}
          {!result && !loading && (
            <div
              className="rounded-2xl border h-full flex flex-col items-center justify-center py-20 text-center px-6"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="w-16 h-16 rounded-2xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center mx-auto mb-4">
                <Brain size={28} className="text-violet-400" />
              </div>
              <h2 className="font-bold theme-text mb-2">AI project blueprint will appear here</h2>
              <p className="theme-muted text-sm max-w-xs leading-relaxed">
                Provide a domain and skills on the left to generate customized hackathon project ideas, complete with tech stacks and team roles.
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div
              className="rounded-2xl border p-6 space-y-5 h-full"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                <span className="text-sm text-violet-400 font-medium">Formulating your project architecture...</span>
              </div>
              <div className="space-y-3">
                <div className="h-6 bg-violet-800/10 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-violet-800/10 rounded w-full animate-pulse" />
                <div className="h-4 bg-violet-800/10 rounded w-5/6 animate-pulse" />
              </div>
              <div className="border-t theme-divider pt-4 space-y-3">
                <div className="h-5 bg-violet-800/10 rounded w-1/4 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 bg-violet-800/10 rounded w-20 animate-pulse" />
                  <div className="h-8 bg-violet-800/10 rounded w-24 animate-pulse" />
                  <div className="h-8 bg-violet-800/10 rounded w-16 animate-pulse" />
                </div>
              </div>
              <div className="border-t theme-divider pt-4 space-y-3">
                <div className="h-5 bg-violet-800/10 rounded w-1/4 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-10 bg-violet-800/10 rounded w-full animate-pulse" />
                  <div className="h-10 bg-violet-800/10 rounded w-full animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Results Result Card */}
          {result && !loading && (
            <div
              className="rounded-2xl border p-6 space-y-6"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
            >
              {/* Project title */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-800 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 border border-violet-400 dark:border-violet-800/40 px-2.5 py-1 rounded-full">
                  Project Blueprint
                </span>
                <h2 className="text-2xl font-bold theme-text mt-3 mb-1.5">{result.project_name}</h2>
              </div>

              {/* Problem statement */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold theme-muted uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-400" />
                  Problem Statement
                </h3>
                <p className="text-sm theme-text leading-relaxed">
                  {result.problem_statement}
                </p>
              </div>

              {/* Solution */}
              <div className="space-y-1.5 border-t theme-divider pt-4">
                <h3 className="text-xs font-semibold theme-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  AI-Powered Solution
                </h3>
                <p className="text-sm theme-text leading-relaxed p-4 rounded-xl border border-violet-900/10 animate-fade-in" style={{ backgroundColor: 'var(--bg-raised)' }}>
                  {result.solution}
                </p>
              </div>

              {/* Tech Stack */}
              <div className="space-y-2.5 border-t theme-divider pt-4">
                <h3 className="text-xs font-semibold theme-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 size={14} className="text-cyan-400" />
                  Recommended Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.tech_stack.map(tech => (
                    <span
                      key={tech}
                      className="text-xs px-3 py-1.5 rounded-lg border font-semibold bg-cyan-100 dark:bg-cyan-950/30 border-cyan-400 dark:border-cyan-800/40 text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5"
                    >
                      <Cpu size={12} />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Team Roles */}
              <div className="space-y-2.5 border-t theme-divider pt-4">
                <h3 className="text-xs font-semibold theme-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-violet-800 dark:text-violet-400" />
                  Suggested Team Roles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.team_roles.map((role, idx) => (
                    <div
                      key={role}
                      className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}
                    >
                      <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-400 dark:border-violet-800/40 flex items-center justify-center text-xs font-bold text-violet-800 dark:text-violet-400">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold theme-text">{role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footnote */}
              <div className="border-t theme-divider pt-4 text-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors animate-pulse"
                >
                  Generate another idea
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
