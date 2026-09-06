// src/pages/admin/AdminProjectDetailPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FolderOpen, Users, FileText, Clock, Tag,
  Edit3, Trash2, RefreshCw, AlertCircle, Search, ExternalLink,
  ShieldCheck, CheckCircle2, GraduationCap, X, MapPin,
  Sparkles, ShieldAlert
} from 'lucide-react'
import PulseAvatar from '../../components/PulseAvatar.jsx'
import {
  getAdminProject,
  updateAdminProject,
  deleteAdminProject
} from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

export default function AdminProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Sub-tab: 'members' | 'applications'
  const [activeTab, setActiveTab] = useState('members')
  const [memberSearch, setMemberSearch] = useState('')
  const [appSearch, setAppSearch] = useState('')

  // Edit / Moderation Modal State
  const [modalOpen, setModalOpen] = useState(false)
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
  const [deleting, setDeleting] = useState(false)

  const fetchProjectDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminProject(projectId)
      setProject(data)
    } catch (err) {
      console.error('Failed to load project details:', err)
      setError(err?.message || 'Failed to load project details.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProjectDetails()
  }, [fetchProjectDetails])

  const handleOpenEdit = () => {
    if (!project) return
    setFormData({
      title: project.title || '',
      description: project.description || '',
      category: project.category || 'college',
      status: project.status || 'recruiting',
      university: project.university || '',
      deadline: formatDateForInput(project.deadline),
      tech: Array.isArray(project.tech) ? project.tech.join(', ') : '',
      open_roles: Array.isArray(project.open_roles) ? project.open_roles.join(', ') : '',
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
      const updated = await updateAdminProject(projectId, payload)
      setProject(prev => ({ ...prev, ...updated }))
      push('Project moderated successfully!', 'success')
      setModalOpen(false)
    } catch (err) {
      console.error('Update project error:', err)
      push(err?.message || 'Failed to update project.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return
    const confirmMsg = `Are you sure you want to delete "${project.title}"?\n\nNote: If students have applied or non-creator collaborator members exist, deletion will be rejected to protect student records.`
    if (!window.confirm(confirmMsg)) return

    try {
      setDeleting(true)
      await deleteAdminProject(project.id)
      push(`Project "${project.title}" deleted successfully.`, 'success')
      navigate('/admin/projects', { replace: true })
    } catch (err) {
      console.error('Delete project error:', err)
      push(err?.message || 'Cannot delete project.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw size={28} className="animate-spin text-violet-500" />
        <p className="text-sm theme-muted">Loading project details...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 text-sm text-violet-500 hover:text-violet-400 font-medium"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </Link>
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-3">
          <AlertCircle size={22} className="shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load project</p>
            <p className="text-xs mt-0.5">{error || 'Project record not found.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const catClass = CAT_BADGES[project.category] || CAT_BADGES.college
  const statusClass = STATUS_BADGES[project.status] || STATUS_BADGES.recruiting
  const members = project.members || []
  const applications = project.applications || []

  const filteredMembers = members.filter(m => {
    if (!memberSearch.trim()) return true
    const q = memberSearch.toLowerCase()
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.role && m.role.toLowerCase().includes(q)) ||
      (m.college && m.college.toLowerCase().includes(q))
    )
  })

  const filteredApplications = applications.filter(a => {
    if (!appSearch.trim()) return true
    const q = appSearch.toLowerCase()
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.college && a.college.toLowerCase().includes(q)) ||
      (a.status && a.status.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/projects"
            className="p-2 rounded-xl border theme-divider hover:border-violet-500 text-sm transition-colors theme-text"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            title="Back to Projects"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-violet-500">
              Project Details
            </span>
            <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
              <h1 className="text-2xl font-bold theme-text tracking-tight">
                {project.title}
              </h1>
              <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${catClass}`}>
                {project.category}
              </span>
              <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${statusClass}`}>
                {project.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEdit}
            className="px-4 py-2 rounded-xl border theme-divider hover:border-amber-500 hover:text-amber-500 text-sm font-semibold transition-colors flex items-center gap-2 theme-text"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <Edit3 size={14} />
            Moderate
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={14} className={deleting ? 'animate-spin' : ''} />
            Delete
          </button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FolderOpen size={22} />
          </div>
          <div>
            <p className="theme-muted text-xs font-medium">Status</p>
            <p className="text-lg font-bold theme-text capitalize">{project.status}</p>
          </div>
        </div>

        {/* Category */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Tag size={22} />
          </div>
          <div>
            <p className="theme-muted text-xs font-medium">Category</p>
            <p className="text-lg font-bold theme-text capitalize">{project.category}</p>
          </div>
        </div>

        {/* Team Members */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Users size={22} />
          </div>
          <div>
            <p className="theme-muted text-xs font-medium">Team Members</p>
            <p className="text-lg font-bold theme-text">{members.length}</p>
          </div>
        </div>

        {/* Applications */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileText size={22} />
          </div>
          <div>
            <p className="theme-muted text-xs font-medium">Applications</p>
            <p className="text-lg font-bold theme-text">{applications.length}</p>
          </div>
        </div>
      </div>

      {/* Main Details: Description & Creator Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description, Tech, Open Roles */}
        <div
          className="lg:col-span-2 p-6 rounded-2xl border space-y-5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Project Description
            </h3>
            <p className="text-sm theme-muted leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Technologies
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(project.tech || []).length > 0 ? (
                project.tech.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  >
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-xs theme-muted">No technologies listed.</span>
              )}
            </div>
          </div>

          {/* Open Roles */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Open Roles Needed
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(project.open_roles || []).length > 0 ? (
                project.open_roles.map((r, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                  >
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-xs theme-muted">No open roles posted.</span>
              )}
            </div>
          </div>

          {/* Timeline & Metadata Footer */}
          <div className="pt-4 border-t theme-divider grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs theme-muted">
            <div>
              <span className="font-semibold theme-text block">Deadline:</span>
              <span>{project.deadline ? formatDate(project.deadline) : 'Flexible'}</span>
            </div>
            <div>
              <span className="font-semibold theme-text block">Created:</span>
              <span>{formatDate(project.created_at)}</span>
            </div>
            <div>
              <span className="font-semibold theme-text block">Last Updated:</span>
              <span>{formatDate(project.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Creator Profile Card */}
        <div
          className="p-6 rounded-2xl border space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Project Creator
          </h3>

          {project.creator ? (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <PulseAvatar
                  avatar={project.creator.avatar}
                  name={project.creator.name}
                  size="lg"
                />
                <div>
                  <h4 className="font-bold text-sm theme-text">{project.creator.name}</h4>
                  <p className="text-xs theme-muted">@{project.creator.username}</p>
                  <p className="text-xs text-violet-500 mt-0.5">{project.creator.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t theme-divider space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="theme-muted">College:</span>
                  <span className="font-medium theme-text text-right max-w-[150px] truncate">
                    {project.creator.college || project.university || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-muted">Branch:</span>
                  <span className="font-medium theme-text text-right max-w-[150px] truncate">
                    {project.creator.branch || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-muted">Year:</span>
                  <span className="font-medium theme-text">{project.creator.year || '—'}</span>
                </div>
              </div>

              <Link
                to={`/admin/students/${project.creator.id}`}
                className="w-full mt-2 py-2 px-3 rounded-xl border theme-divider hover:border-violet-500 text-xs font-semibold theme-text flex items-center justify-center gap-1.5 transition-colors"
                style={{ backgroundColor: 'var(--bg-raised)' }}
              >
                View Student Profile
                <ExternalLink size={12} />
              </Link>
            </div>
          ) : (
            <p className="text-xs theme-muted">Creator details not available.</p>
          )}
        </div>
      </div>

      {/* Tabs Section: Team Members vs Applications */}
      <div
        className="rounded-2xl border overflow-hidden p-5 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b theme-divider pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'members' ? 'bg-violet-600 text-white' : 'theme-muted hover:theme-text'}`}
            >
              <Users size={14} />
              Team Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'applications' ? 'bg-violet-600 text-white' : 'theme-muted hover:theme-text'}`}
            >
              <FileText size={14} />
              Applications ({applications.length})
            </button>
          </div>

          {/* Tab Search Input */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'members' ? 'Search members...' : 'Search applications...'}
              value={activeTab === 'members' ? memberSearch : appSearch}
              onChange={(e) => {
                if (activeTab === 'members') setMemberSearch(e.target.value)
                else setAppSearch(e.target.value)
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border theme-divider focus:outline-none focus:border-violet-500"
              style={{ backgroundColor: 'var(--bg-raised)' }}
            />
          </div>
        </div>

        {/* Tab 1: Team Members Table */}
        {activeTab === 'members' && (
          <div className="overflow-x-auto rounded-xl border theme-divider">
            <table className="w-full text-left text-sm">
              <thead
                className="text-xs uppercase font-semibold border-b theme-divider"
                style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}
              >
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">College & Branch</th>
                  <th className="px-4 py-3">Project Role</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-divider">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <p className="theme-muted text-xs">
                        {members.length === 0 ? 'No members in this project.' : 'No members match search.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr
                      key={m.id || m.student_id}
                      className="hover:bg-violet-50/30 dark:hover:bg-violet-950/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <PulseAvatar
                            avatar={m.avatar}
                            name={m.name}
                            size="sm"
                          />
                          <div>
                            <span className="font-semibold text-xs theme-text block">
                              {m.name}
                            </span>
                            <span className="text-[10px] theme-muted">
                              @{m.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs theme-muted">{m.email}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="theme-text block font-medium">{m.college || '—'}</span>
                        <span className="text-[11px] theme-muted">{m.branch || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {m.role || 'Member'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs theme-muted whitespace-nowrap">
                        {formatDate(m.joined_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/students/${m.student_id}`}
                          className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-400 font-semibold transition-colors"
                        >
                          View Student
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Applications Table */}
        {activeTab === 'applications' && (
          <div className="overflow-x-auto rounded-xl border theme-divider">
            <table className="w-full text-left text-sm">
              <thead
                className="text-xs uppercase font-semibold border-b theme-divider"
                style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}
              >
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">College & Branch</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Applied Date</th>
                  <th className="px-4 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-divider">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <p className="theme-muted text-xs">
                        {applications.length === 0 ? 'No applications submitted for this project.' : 'No applications match search.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-violet-50/30 dark:hover:bg-violet-950/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <PulseAvatar
                            avatar={app.avatar}
                            name={app.name}
                            size="sm"
                          />
                          <div>
                            <span className="font-semibold text-xs theme-text block">
                              {app.name}
                            </span>
                            <span className="text-[10px] theme-muted">
                              @{app.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs theme-muted">{app.email}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="theme-text block font-medium">{app.college || '—'}</span>
                        <span className="text-[11px] theme-muted">{app.branch || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : app.status === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs theme-muted whitespace-nowrap">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/students/${app.student_id}`}
                          className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-400 font-semibold transition-colors"
                        >
                          View Student
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Moderation / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-xl overflow-hidden my-8"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
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

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    University / College
                  </label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Deadline
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

              <div>
                <label className="block text-xs font-semibold theme-text mb-1">
                  Description *
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Technologies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tech}
                    onChange={(e) => setFormData(prev => ({ ...prev, tech: e.target.value }))}
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
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                </div>
              </div>

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
