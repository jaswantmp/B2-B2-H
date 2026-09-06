// src/pages/admin/AdminProjectsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen, Search, Filter, RefreshCw, AlertCircle,
  Eye, Edit3, Trash2, Users, FileText, Tag, Clock,
  X, Check, ChevronLeft, ChevronRight, AlertTriangle,
  Sparkles, ExternalLink, ShieldAlert
} from 'lucide-react'
import PulseAvatar from '../../components/PulseAvatar.jsx'
import {
  getAdminProjects,
  updateAdminProject,
  deleteAdminProject
} from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

const CATEGORIES = [
  { key: '', label: 'All Categories' },
  { key: 'college', label: 'College' },
  { key: 'research', label: 'Research' },
  { key: 'opensource', label: 'Open Source' },
  { key: 'startup', label: 'Startup' },
]

const STATUSES = [
  { key: '', label: 'All Statuses' },
  { key: 'recruiting', label: 'Recruiting' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
]

const CAT_BADGES = {
  college: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  research: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  opensource: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  startup: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
}

const STATUS_BADGES = {
  recruiting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  completed: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return d
  }
}

function formatDateForInput(d) {
  if (!d) return ''
  try {
    const dateObj = new Date(d)
    if (isNaN(dateObj.getTime())) return ''
    return dateObj.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export default function AdminProjectsPage() {
  const { push } = useToast()

  // List & Filter States
  const [projects, setProjects] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // UI States
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  // Edit / Moderation Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'college',
    status: 'recruiting',
    university: '',
    deadline: '',
    tech: '',
    open_roles: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      }
      const data = await getAdminProjects(params)
      setProjects(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Failed to load admin projects:', err)
      setError(err?.message || 'Failed to load projects. Please verify server connection.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, categoryFilter, statusFilter])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchProjects()
  }

  const handleClearFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const handleOpenEdit = (p) => {
    setEditingProject(p)
    setFormData({
      title: p.title || '',
      description: p.description || '',
      category: p.category || 'college',
      status: p.status || 'recruiting',
      university: p.university || '',
      deadline: formatDateForInput(p.deadline),
      tech: Array.isArray(p.tech) ? p.tech.join(', ') : '',
      open_roles: Array.isArray(p.open_roles) ? p.open_roles.join(', ') : '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Title is required.'
    if (!formData.description.trim()) errors.description = 'Description is required.'
    if (!formData.category) errors.category = 'Category is required.'
    if (!formData.status) errors.status = 'Status is required.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const techArr = formData.tech
      ? formData.tech.split(',').map(t => t.trim()).filter(Boolean)
      : []
    const rolesArr = formData.open_roles
      ? formData.open_roles.split(',').map(r => r.trim()).filter(Boolean)
      : []

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      status: formData.status,
      university: formData.university.trim() || null,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      tech: techArr,
      open_roles: rolesArr,
    }

    try {
      setSubmitting(true)
      await updateAdminProject(editingProject.id, payload)
      push(`Project "${payload.title}" moderated successfully!`, 'success')
      setModalOpen(false)
      fetchProjects()
    } catch (err) {
      console.error('Update project error:', err)
      push(err?.message || 'Failed to update project.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (p) => {
    const confirmMsg = `Are you sure you want to delete "${p.title}"?\n\nNote: If students have applied or non-creator collaborator members exist, deletion will be rejected to protect student records.`
    if (!window.confirm(confirmMsg)) return

    try {
      setDeletingId(p.id)
      await deleteAdminProject(p.id)
      push(`Project "${p.title}" deleted successfully.`, 'success')
      fetchProjects()
    } catch (err) {
      console.error('Delete project error:', err)
      push(err?.message || 'Cannot delete project.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <FolderOpen size={24} className="text-violet-500" />
            <h1 className="text-2xl font-bold theme-text tracking-tight">Project Management</h1>
          </div>
          <p className="theme-muted text-sm mt-1">
            Oversee student workspaces, moderate project status, and monitor team applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
            Total: {total.toLocaleString()} Projects
          </span>
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="p-2 rounded-xl border theme-divider hover:border-violet-500 text-sm transition-all"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            title="Refresh List"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-violet-500' : ''} />
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        className="p-4 sm:p-5 rounded-2xl border space-y-3.5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by project title, description, or university..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border theme-divider focus:outline-none focus:border-violet-500"
              style={{ backgroundColor: 'var(--bg-raised)' }}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Search size={14} />
            Search
          </button>
        </form>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            {STATUSES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Indicator */}
        {(search || categoryFilter || statusFilter) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleClearFilters}
              className="text-xs text-violet-500 hover:text-violet-400 font-semibold transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchProjects}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Projects Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead
              className="text-xs uppercase font-semibold border-b theme-divider"
              style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}
            >
              <tr>
                <th className="px-4 py-3.5">Project</th>
                <th className="px-4 py-3.5">Category & Status</th>
                <th className="px-4 py-3.5">Creator</th>
                <th className="px-4 py-3.5">Deadline</th>
                <th className="px-4 py-3.5">Tech & Roles</th>
                <th className="px-4 py-3.5 text-center">Team / Apps</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-divider">
              {loading && projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-violet-500" />
                      <p className="theme-muted text-xs">Loading projects...</p>
                    </div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderOpen size={32} className="text-slate-400" />
                      <p className="theme-text font-medium text-sm">No projects found</p>
                      <p className="theme-muted text-xs">Try adjusting your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const catClass = CAT_BADGES[p.category] || CAT_BADGES.college
                  const statusClass = STATUS_BADGES[p.status] || STATUS_BADGES.recruiting
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-violet-50/30 dark:hover:bg-violet-950/10 transition-colors"
                    >
                      {/* Project Title & Desc */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <Link
                            to={`/admin/projects/${p.id}`}
                            className="font-semibold theme-text hover:text-violet-500 transition-colors line-clamp-1"
                          >
                            {p.title}
                          </Link>
                          <p className="theme-muted text-xs line-clamp-1 max-w-xs">
                            {p.description}
                          </p>
                        </div>
                      </td>

                      {/* Category & Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${catClass}`}>
                            {p.category}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>
                            {p.status}
                          </span>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="px-4 py-3.5">
                        {p.creator ? (
                          <div className="flex items-center gap-2">
                            <PulseAvatar
                              avatar={p.creator.avatar}
                              name={p.creator.name}
                              size="sm"
                            />
                            <div className="text-xs">
                              <Link
                                to={`/admin/students/${p.creator.id}`}
                                className="font-semibold theme-text hover:text-violet-500 transition-colors block"
                              >
                                {p.creator.name}
                              </Link>
                              <span className="theme-muted text-[11px] block">
                                {p.creator.college || p.university || 'Student'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs theme-muted">Unknown</span>
                        )}
                      </td>

                      {/* Deadline */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5 theme-muted">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span>{p.deadline ? formatDate(p.deadline) : 'Flexible'}</span>
                        </div>
                      </td>

                      {/* Tech & Roles */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(p.tech || []).slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            >
                              {t}
                            </span>
                          ))}
                          {(p.open_roles || []).slice(0, 1).map((r, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                            >
                              {r}
                            </span>
                          ))}
                          {((p.tech?.length || 0) + (p.open_roles?.length || 0) > 3) && (
                            <span className="text-[10px] theme-muted">
                              +{(p.tech?.length || 0) + (p.open_roles?.length || 0) - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Team / Applications Count */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            title="Team Members"
                          >
                            <Users size={11} />
                            {p.member_count ?? 1}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            title="Collaboration Applications"
                          >
                            <FileText size={11} />
                            {p.application_count ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/projects/${p.id}`}
                            className="p-1.5 rounded-lg border theme-divider hover:border-violet-500 hover:text-violet-500 transition-colors"
                            title="View Project Details"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg border theme-divider hover:border-amber-500 hover:text-amber-500 transition-colors"
                            title="Moderate Project"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deletingId === p.id}
                            className="p-1.5 rounded-lg border theme-divider hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Safe Delete"
                          >
                            <Trash2 size={14} className={deletingId === p.id ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          className="p-3.5 border-t theme-divider flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ backgroundColor: 'var(--bg-raised)' }}
        >
          <span className="theme-muted">
            Showing {projects.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, total)} of {total.toLocaleString()} projects
          </span>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 rounded border theme-divider text-xs focus:outline-none focus:border-violet-500"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded border theme-divider hover:border-violet-500 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="theme-text font-medium px-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded border theme-divider hover:border-violet-500 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Moderation / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-xl overflow-hidden my-8"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 border-b theme-divider flex items-center justify-between"
              style={{ backgroundColor: 'var(--bg-raised)' }}
            >
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-violet-500" />
                <h2 className="font-bold text-base theme-text">Moderate Project</h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-500/10 theme-muted hover:theme-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Notice */}
              <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 text-xs theme-muted flex items-start gap-2">
                <ShieldAlert size={16} className="text-violet-500 shrink-0 mt-0.5" />
                <span>
                  Admin moderation is isolated to project content and lifecycle status. Creator ownership and team memberships remain strictly protected.
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold theme-text mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.title ? 'border-red-500' : 'theme-divider'}`}
                  style={{ backgroundColor: 'var(--bg-raised)' }}
                />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  >
                    <option value="college">College Project</option>
                    <option value="research">Research</option>
                    <option value="opensource">Open Source</option>
                    <option value="startup">Startup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  >
                    <option value="recruiting">Recruiting</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* University & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    University / College
                  </label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                    placeholder="e.g. SKCET or Anna University"
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold theme-text mb-1">
                  Project Description *
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.description ? 'border-red-500' : 'theme-divider'}`}
                  style={{ backgroundColor: 'var(--bg-raised)' }}
                />
                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
              </div>

              {/* Tech & Open Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Technologies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tech}
                    onChange={(e) => setFormData(prev => ({ ...prev, tech: e.target.value }))}
                    placeholder="e.g. React, Python, FastAPI"
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Open Roles (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.open_roles}
                    onChange={(e) => setFormData(prev => ({ ...prev, open_roles: e.target.value }))}
                    placeholder="e.g. Frontend Lead, ML Engineer"
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t theme-divider flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl border theme-divider hover:border-slate-400 text-sm font-medium theme-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
