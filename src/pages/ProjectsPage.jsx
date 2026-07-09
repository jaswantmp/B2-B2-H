// src/pages/ProjectsPage.jsx
import { useState, useEffect } from 'react'
import { FolderOpen, Search, Users, Clock, Tag, ArrowRight, ExternalLink } from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import { getProjects } from '../services/api.js'


const CATEGORIES = [
  { key: '',           label: 'All' },
  { key: 'college',   label: 'College Projects' },
  { key: 'research',  label: 'Research' },
  { key: 'opensource', label: 'Open Source' },
  { key: 'startup',   label: 'Startup' },
]

const CAT_STYLES = {
  college:    { bg: 'bg-blue-900/30   border-blue-800/40   text-blue-300',    dot: 'bg-blue-400'    },
  research:   { bg: 'bg-violet-900/30 border-violet-800/40 text-violet-300',  dot: 'bg-violet-400'  },
  opensource: { bg: 'bg-emerald-900/30 border-emerald-800/40 text-emerald-300', dot: 'bg-emerald-400' },
  startup:    { bg: 'bg-amber-900/30  border-amber-800/40  text-amber-300',   dot: 'bg-amber-400'   },
}

const STATUS_STYLES = {
  recruiting: 'bg-amber-900/30 border-amber-800/40 text-amber-300',
  active:     'bg-emerald-900/30 border-emerald-800/40 text-emerald-300',
  completed:  'bg-slate-800/60  border-slate-700/50  text-slate-400',
}

function ProjectCard({ project }) {
  const cat    = CAT_STYLES[project.category] ?? CAT_STYLES.college
  const status = STATUS_STYLES[project.status] ?? STATUS_STYLES.active

  return (
    <article
      className="rounded-2xl p-5 border hover:border-violet-500/50 transition-all duration-200 flex flex-col gap-4"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cat.bg}`}>
              {CATEGORIES.find(c => c.key === project.category)?.label ?? project.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${status}`}>
              {project.status}
            </span>
          </div>
          <h2 className="font-bold theme-text text-base leading-snug">{project.title}</h2>
          <p className="text-xs theme-muted mt-0.5">{project.university}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm theme-muted leading-relaxed line-clamp-2">{project.description}</p>

      {/* Tech stack */}
      <div className="flex flex-wrap gap-1.5">
        {project.tech.map(t => (
          <span
            key={t}
            className="text-xs px-2.5 py-0.5 rounded-md border font-medium theme-muted"
            style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-strong)' }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Open roles */}
      <div>
        <p className="text-xs font-semibold theme-muted uppercase tracking-wider mb-1.5">Open Roles</p>
        <div className="flex flex-wrap gap-1.5">
          {project.openRoles.map(role => (
            <span key={role} className="text-xs px-2.5 py-0.5 rounded-full bg-violet-900/30 border border-violet-800/40 text-violet-300 font-medium">
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3 border-t theme-divider"
      >
        <div className="flex items-center gap-2">
          {/* Team avatars */}
          <div className="flex -space-x-2">
            {project.team.slice(0, 3).map(member => (
              <PulseAvatar key={member.id} user={member} size="xs" showTooltip={true} />
            ))}
          </div>
          <span className="text-xs theme-muted">
            {project.team.length} member{project.team.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {project.deadline && (
            <span className="text-xs theme-muted flex items-center gap-1">
              <Clock size={11} />
              {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <button className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors">
            Apply <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function ProjectsPage() {
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [projectsList, setProjectsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects().then(data => {
      setProjectsList(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  if (loading) {
    return <div className="p-6 lg:p-8 max-w-7xl theme-text">Loading projects...</div>
  }

  const filtered = projectsList.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tech.some(t => t.toLowerCase().includes(q))
    const matchCat = !category || p.category === category
    return matchSearch && matchCat
  })

  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c.key] = c.key ? projectsList.filter(p => p.category === c.key).length : projectsList.length
    return acc
  }, {})


  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold theme-text mb-1 flex items-center gap-2">
          <FolderOpen size={22} className="text-violet-400" /> Projects
        </h1>
        <p className="theme-muted text-sm">
          College projects, research, open source, and startup opportunities. Find your next collaboration.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {CATEGORIES.filter(c => c.key).map(c => {
          const sty = CAT_STYLES[c.key]
          return (
            <button
              key={c.key}
              onClick={() => setCategory(v => v === c.key ? '' : c.key)}
              className={`rounded-xl p-4 border text-left transition-all ${
                category === c.key ? `${sty.bg} border-opacity-100` : 'border theme-divider hover:border-violet-500/40'
              }`}
              style={category !== c.key ? { backgroundColor: 'var(--bg-surface)' } : {}}
            >
              <div className={`w-2 h-2 rounded-full mb-2 ${sty.dot}`} />
              <div className="text-xl font-bold theme-text">{counts[c.key]}</div>
              <div className="text-xs theme-muted">{c.label}</div>
            </button>
          )
        })}
      </div>

      {/* Search + category pills */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, tech, or keyword..."
            className="theme-input w-full pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(v => v === c.key ? '' : c.key)}
              className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${
                category === c.key
                  ? 'bg-violet-700 border-violet-500 text-white'
                  : 'theme-btn-ghost'
              }`}
            >
              {c.label} {c.key ? `(${counts[c.key]})` : `(${projectsList.length})`}
            </button>

          ))}
        </div>
      </div>

      <p className="text-xs theme-muted mb-5">{filtered.length} project{filtered.length !== 1 ? 's' : ''} found</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={36} className="theme-muted mx-auto mb-3" />
          <p className="theme-text font-medium mb-1">No projects match your search</p>
          <button
            onClick={() => { setSearch(''); setCategory('') }}
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}
