// src/pages/admin/AdminHackathonDetailPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Calendar, MapPin, Trophy, Users, Tag, Clock,
  Edit3, Trash2, RefreshCw, AlertCircle, Search, ExternalLink,
  ShieldCheck, CheckCircle2, GraduationCap, X
} from 'lucide-react'
import PulseAvatar from '../../components/PulseAvatar.jsx'
import {
  getAdminHackathon,
  updateAdminHackathon,
  deleteAdminHackathon
} from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

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

function formatDateTimeForInput(d) {
  if (!d) return ''
  try {
    const dateObj = new Date(d)
    if (isNaN(dateObj.getTime())) return ''
    return dateObj.toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

export default function AdminHackathonDetailPage() {
  const { hackathonId } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()

  const [hackathon, setHackathon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [regSearch, setRegSearch] = useState('')

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    date: '',
    end_date: '',
    location: '',
    prize: '',
    team_size: '2-4',
    description: '',
    tracks: '',
    tags: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminHackathon(hackathonId)
      setHackathon(data)
    } catch (err) {
      console.error('Failed to load hackathon details:', err)
      setError(err?.message || 'Failed to load hackathon details.')
    } finally {
      setLoading(false)
    }
  }, [hackathonId])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  const handleOpenEdit = () => {
    if (!hackathon) return
    setFormData({
      title: hackathon.title || '',
      organizer: hackathon.organizer || '',
      date: formatDateTimeForInput(hackathon.date),
      end_date: formatDateTimeForInput(hackathon.end_date),
      location: hackathon.location || '',
      prize: hackathon.prize || '',
      team_size: hackathon.team_size || '2-4',
      description: hackathon.description || '',
      tracks: Array.isArray(hackathon.tracks) ? hackathon.tracks.join(', ') : (hackathon.tracks || ''),
      tags: Array.isArray(hackathon.tags) ? hackathon.tags.join(', ') : (hackathon.tags || ''),
    })
    setFormErrors({})
    setEditOpen(true)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Title is required.'
    if (!formData.organizer.trim()) errors.organizer = 'Organizer is required.'
    if (!formData.date) errors.date = 'Start date is required.'
    if (!formData.end_date) errors.end_date = 'End date is required.'
    if (formData.date && formData.end_date && new Date(formData.end_date) < new Date(formData.date)) {
      errors.end_date = 'End date cannot be earlier than start date.'
    }
    if (!formData.location.trim()) errors.location = 'Location is required.'
    if (!formData.prize.trim()) errors.prize = 'Prize is required.'
    if (!formData.team_size.trim()) errors.team_size = 'Team size is required.'
    if (!formData.description.trim()) errors.description = 'Description is required.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const tracksArr = formData.tracks
      ? formData.tracks.split(',').map(t => t.trim()).filter(Boolean)
      : []
    const tagsArr = formData.tags
      ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

    const payload = {
      title: formData.title.trim(),
      organizer: formData.organizer.trim(),
      date: new Date(formData.date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      location: formData.location.trim(),
      prize: formData.prize.trim(),
      team_size: formData.team_size.trim(),
      description: formData.description.trim(),
      tracks: tracksArr,
      tags: tagsArr,
    }

    try {
      setSubmitting(true)
      const updated = await updateAdminHackathon(hackathonId, payload)
      setHackathon(prev => ({ ...prev, ...updated }))
      push('Hackathon updated successfully!', 'success')
      setEditOpen(false)
    } catch (err) {
      console.error('Update hackathon error:', err)
      push(err?.message || 'Failed to update hackathon.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!hackathon) return
    const confirmMsg = `Are you sure you want to delete "${hackathon.title}"?\n\nNote: If students are registered or teams exist, deletion will be rejected to protect registration integrity.`
    if (!window.confirm(confirmMsg)) return

    try {
      setDeleting(true)
      await deleteAdminHackathon(hackathon.id)
      push(`Hackathon "${hackathon.title}" deleted successfully.`, 'success')
      navigate('/admin/hackathons', { replace: true })
    } catch (err) {
      console.error('Delete hackathon error:', err)
      push(err?.message || 'Cannot delete hackathon.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw size={28} className="animate-spin text-violet-500" />
        <p className="text-sm theme-muted">Loading hackathon details...</p>
      </div>
    )
  }

  if (error || !hackathon) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          to="/admin/hackathons"
          className="inline-flex items-center gap-2 text-sm text-violet-500 hover:text-violet-400 font-medium"
        >
          <ArrowLeft size={16} />
          Back to Hackathons
        </Link>
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-3">
          <AlertCircle size={22} className="shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load hackathon</p>
            <p className="text-xs mt-0.5">{error || 'Hackathon record not found.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const registrations = hackathon.registrations || []
  const filteredRegistrations = registrations.filter(r => {
    if (!regSearch.trim()) return true
    const q = regSearch.toLowerCase()
    return (
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.college && r.college.toLowerCase().includes(q)) ||
      (r.branch && r.branch.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/hackathons"
            className="p-2 rounded-xl border theme-divider hover:border-violet-500 text-sm transition-colors theme-text"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            title="Back to Hackathons"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-violet-500">
              Hackathon Details
            </span>
            <h1 className="text-2xl font-bold theme-text tracking-tight">
              {hackathon.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEdit}
            className="px-4 py-2 rounded-xl border theme-divider hover:border-amber-500 hover:text-amber-500 text-sm font-semibold transition-colors flex items-center gap-2 theme-text"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <Edit3 size={14} />
            Edit
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

      {/* Info Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Registration Stat */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users size={22} />
          </div>
          <div>
            <p className="theme-muted text-xs font-medium">Registrations</p>
            <p className="text-xl font-bold theme-text">
              {hackathon.registration_count ?? registrations.length}
            </p>
          </div>
        </div>

        {/* Prize Pool */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Trophy size={22} />
          </div>
          <div>
            <p className="theme-muted text-xs font-medium">Prize Pool</p>
            <p className="text-xl font-bold theme-text">{hackathon.prize}</p>
          </div>
        </div>

        {/* Location */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <MapPin size={22} />
          </div>
          <div className="min-w-0">
            <p className="theme-muted text-xs font-medium">Location</p>
            <p className="text-sm font-semibold theme-text truncate">{hackathon.location}</p>
          </div>
        </div>

        {/* Team Size */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Users size={22} />
          </div>
          <div>
            <p className="theme-muted text-xs font-medium">Team Size</p>
            <p className="text-sm font-semibold theme-text">{hackathon.team_size} members</p>
          </div>
        </div>
      </div>

      {/* Main Details & Metadata */}
      <div
        className="p-6 rounded-2xl border space-y-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Description & Organizer */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">
                Organizer
              </h3>
              <p className="text-sm font-semibold theme-text">{hackathon.organizer}</p>
            </div>

            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">
                Description
              </h3>
              <p className="text-sm theme-muted leading-relaxed whitespace-pre-line">
                {hackathon.description}
              </p>
            </div>
          </div>

          {/* Right Column: Schedule, Tracks, Tags */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border theme-divider space-y-2" style={{ backgroundColor: 'var(--bg-raised)' }}>
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Timeline & Schedule
              </h3>
              <div className="flex items-center gap-2 text-xs theme-text">
                <Clock size={14} className="text-violet-500" />
                <span className="font-medium">Starts:</span>
                <span>{formatDate(hackathon.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs theme-text">
                <Clock size={14} className="text-violet-500" />
                <span className="font-medium">Ends:</span>
                <span>{formatDate(hackathon.end_date)}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                Tracks
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(hackathon.tracks || []).length > 0 ? (
                  hackathon.tracks.map((tr, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    >
                      {tr}
                    </span>
                  ))
                ) : (
                  <span className="text-xs theme-muted">No specific tracks listed.</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(hackathon.tags || []).length > 0 ? (
                  hackathon.tags.map((tg, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                    >
                      #{tg}
                    </span>
                  ))
                ) : (
                  <span className="text-xs theme-muted">No tags listed.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations Section */}
      <div
        className="rounded-2xl border overflow-hidden space-y-4 p-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-emerald-500" />
              <h2 className="text-lg font-bold theme-text">
                Registered Students ({registrations.length})
              </h2>
            </div>
            <p className="theme-muted text-xs mt-0.5">
              Verified students currently enrolled for this hackathon.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search registrations..."
              value={regSearch}
              onChange={(e) => setRegSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border theme-divider focus:outline-none focus:border-violet-500"
              style={{ backgroundColor: 'var(--bg-raised)' }}
            />
          </div>
        </div>

        {/* Registrations Table */}
        <div className="overflow-x-auto rounded-xl border theme-divider">
          <table className="w-full text-left text-sm">
            <thead
              className="text-xs uppercase font-semibold border-b theme-divider"
              style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}
            >
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">College & Branch</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Registered At</th>
                <th className="px-4 py-3 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-divider">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <p className="theme-muted text-xs">
                      {registrations.length === 0
                        ? 'No students have registered for this hackathon yet.'
                        : 'No registrations match your search.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr
                    key={reg.id || reg.student_id}
                    className="hover:bg-violet-50/30 dark:hover:bg-violet-950/10 transition-colors"
                  >
                    {/* Student Avatar + Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <PulseAvatar
                          avatar={reg.avatar}
                          name={reg.student_name || reg.name}
                          size="sm"
                        />
                        <div>
                          <span className="font-semibold text-xs theme-text block">
                            {reg.student_name || reg.name}
                          </span>
                          <span className="text-[10px] theme-muted">
                            ID: {reg.student_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-xs theme-muted">
                      {reg.student_email || reg.email || '—'}
                    </td>

                    {/* College & Branch */}
                    <td className="px-4 py-3 text-xs">
                      <span className="theme-text block font-medium">
                        {reg.college || '—'}
                      </span>
                      <span className="text-[11px] theme-muted">
                        {reg.branch || '—'}
                      </span>
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3 text-xs theme-muted">
                      {reg.year || '—'}
                    </td>

                    {/* Registered Date */}
                    <td className="px-4 py-3 text-xs theme-muted whitespace-nowrap">
                      {formatDate(reg.registered_at)}
                    </td>

                    {/* Link to Admin Student View */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/students/${reg.student_id}`}
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
      </div>

      {/* Edit Modal */}
      {editOpen && (
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
                <Calendar size={18} className="text-violet-500" />
                <h2 className="font-bold text-base theme-text">Edit Hackathon</h2>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-500/10 theme-muted hover:theme-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold theme-text mb-1">
                  Hackathon Title *
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
                    Organizer *
                  </label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.organizer ? 'border-red-500' : 'theme-divider'}`}
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  {formErrors.organizer && <p className="text-red-500 text-xs mt-1">{formErrors.organizer}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.location ? 'border-red-500' : 'theme-divider'}`}
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.date ? 'border-red-500' : 'theme-divider'}`}
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.end_date ? 'border-red-500' : 'theme-divider'}`}
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  {formErrors.end_date && <p className="text-red-500 text-xs mt-1">{formErrors.end_date}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Prize Pool *
                  </label>
                  <input
                    type="text"
                    value={formData.prize}
                    onChange={(e) => setFormData(prev => ({ ...prev, prize: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.prize ? 'border-red-500' : 'theme-divider'}`}
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  {formErrors.prize && <p className="text-red-500 text-xs mt-1">{formErrors.prize}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Team Size *
                  </label>
                  <input
                    type="text"
                    value={formData.team_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, team_size: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.team_size ? 'border-red-500' : 'theme-divider'}`}
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  {formErrors.team_size && <p className="text-red-500 text-xs mt-1">{formErrors.team_size}</p>}
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
                    Tracks (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tracks}
                    onChange={(e) => setFormData(prev => ({ ...prev, tracks: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t theme-divider flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
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
