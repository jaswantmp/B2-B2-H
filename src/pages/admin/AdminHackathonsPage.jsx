// src/pages/admin/AdminHackathonsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Search, Plus, Filter, RefreshCw, AlertCircle,
  Eye, Edit3, Trash2, MapPin, Trophy, Users, Tag, Clock,
  X, Check, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react'
import {
  getAdminHackathons,
  createAdminHackathon,
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
      year: 'numeric'
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

export default function AdminHackathonsPage() {
  const { push } = useToast()

  // List State
  const [hackathons, setHackathons] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // Filters State
  const [search, setSearch] = useState('')
  const [organizerFilter, setOrganizerFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [trackFilter, setTrackFilter] = useState('')

  // UI State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  // Modal State (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHackathon, setEditingHackathon] = useState(null)
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

  const fetchHackathons = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        organizer: organizerFilter.trim() || undefined,
        location: locationFilter.trim() || undefined,
        tag: tagFilter.trim() || undefined,
        track: trackFilter.trim() || undefined,
      }
      const data = await getAdminHackathons(params)
      setHackathons(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Failed to load hackathons:', err)
      setError(err?.message || 'Failed to load hackathons. Please check your network connection.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, organizerFilter, locationFilter, tagFilter, trackFilter])

  useEffect(() => {
    fetchHackathons()
  }, [fetchHackathons])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchHackathons()
  }

  const handleClearFilters = () => {
    setSearch('')
    setOrganizerFilter('')
    setLocationFilter('')
    setTagFilter('')
    setTrackFilter('')
    setPage(1)
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingHackathon(null)
    setFormData({
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
    setFormErrors({})
    setModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (h) => {
    setEditingHackathon(h)
    setFormData({
      title: h.title || '',
      organizer: h.organizer || '',
      date: formatDateTimeForInput(h.date),
      end_date: formatDateTimeForInput(h.end_date),
      location: h.location || '',
      prize: h.prize || '',
      team_size: h.team_size || '2-4',
      description: h.description || '',
      tracks: Array.isArray(h.tracks) ? h.tracks.join(', ') : (h.tracks || ''),
      tags: Array.isArray(h.tags) ? h.tags.join(', ') : (h.tags || ''),
    })
    setFormErrors({})
    setModalOpen(true)
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
    if (!formData.team_size.trim()) errors.team_size = 'Team size is required (e.g. 2-4).'
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
      if (editingHackathon) {
        await updateAdminHackathon(editingHackathon.id, payload)
        push(`Hackathon "${payload.title}" updated successfully!`, 'success')
      } else {
        await createAdminHackathon(payload)
        push(`Hackathon "${payload.title}" created successfully!`, 'success')
      }
      setModalOpen(false)
      fetchHackathons()
    } catch (err) {
      console.error('Save hackathon error:', err)
      push(err?.message || 'Failed to save hackathon.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (h) => {
    const confirmMsg = `Are you sure you want to delete "${h.title}"?\n\nNote: Hackathons with existing student registrations or active teams cannot be deleted.`
    if (!window.confirm(confirmMsg)) return

    try {
      setDeletingId(h.id)
      await deleteAdminHackathon(h.id)
      push(`Hackathon "${h.title}" deleted successfully.`, 'success')
      fetchHackathons()
    } catch (err) {
      console.error('Delete hackathon error:', err)
      // Display clear reason to admin (e.g. 409 Conflict if registrations exist)
      push(err?.message || 'Cannot delete hackathon.', 'error')
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
            <Calendar size={24} className="text-violet-500" />
            <h1 className="text-2xl font-bold theme-text tracking-tight">Hackathon Management</h1>
          </div>
          <p className="theme-muted text-sm mt-1">
            Create, edit, search, and monitor hackathons and student participation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Create Hackathon
          </button>
          <button
            onClick={fetchHackathons}
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
              placeholder="Search by title, organizer, location, description..."
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

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <input
            type="text"
            placeholder="Filter organizer..."
            value={organizerFilter}
            onChange={(e) => { setOrganizerFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          />
          <input
            type="text"
            placeholder="Filter location..."
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          />
          <input
            type="text"
            placeholder="Filter tag (e.g. AI/ML)..."
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          />
          <input
            type="text"
            placeholder="Filter track..."
            value={trackFilter}
            onChange={(e) => { setTrackFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          />
        </div>

        {(search || organizerFilter || locationFilter || tagFilter || trackFilter) && (
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
            onClick={fetchHackathons}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Hackathons Table / Cards Container */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Table View (Desktop & Tablet) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead
              className="text-xs uppercase font-semibold border-b theme-divider"
              style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}
            >
              <tr>
                <th className="px-4 py-3.5">Hackathon</th>
                <th className="px-4 py-3.5">Organizer & Location</th>
                <th className="px-4 py-3.5">Dates</th>
                <th className="px-4 py-3.5">Prize & Team</th>
                <th className="px-4 py-3.5">Tracks & Tags</th>
                <th className="px-4 py-3.5 text-center">Registrations</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-divider">
              {loading && hackathons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-violet-500" />
                      <p className="theme-muted text-xs">Loading hackathons...</p>
                    </div>
                  </td>
                </tr>
              ) : hackathons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar size={32} className="text-slate-400" />
                      <p className="theme-text font-medium text-sm">No hackathons found</p>
                      <p className="theme-muted text-xs">Try adjusting your search criteria or create a new hackathon.</p>
                      <button
                        onClick={handleOpenCreate}
                        className="mt-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Create First Hackathon
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                hackathons.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-violet-50/30 dark:hover:bg-violet-950/10 transition-colors"
                  >
                    {/* Title */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <Link
                          to={`/admin/hackathons/${h.id}`}
                          className="font-semibold theme-text hover:text-violet-500 transition-colors line-clamp-1"
                        >
                          {h.title}
                        </Link>
                        <p className="theme-muted text-xs line-clamp-1 max-w-xs">
                          {h.description}
                        </p>
                      </div>
                    </td>

                    {/* Organizer & Location */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5 text-xs">
                        <span className="font-medium theme-text block">{h.organizer}</span>
                        <span className="theme-muted flex items-center gap-1">
                          <MapPin size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate max-w-[140px]">{h.location}</span>
                        </span>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-xs space-y-0.5">
                        <span className="theme-text block font-medium">
                          {formatDate(h.date)}
                        </span>
                        <span className="theme-muted text-[11px] block">
                          to {formatDate(h.end_date)}
                        </span>
                      </div>
                    </td>

                    {/* Prize & Team Size */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-xs space-y-0.5">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold block flex items-center gap-1">
                          <Trophy size={12} />
                          {h.prize}
                        </span>
                        <span className="theme-muted text-[11px] flex items-center gap-1">
                          <Users size={11} />
                          Team: {h.team_size}
                        </span>
                      </div>
                    </td>

                    {/* Tracks & Tags */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(h.tracks || []).slice(0, 2).map((tr, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          >
                            {tr}
                          </span>
                        ))}
                        {(h.tags || []).slice(0, 2).map((tg, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                          >
                            #{tg}
                          </span>
                        ))}
                        {((h.tracks?.length || 0) + (h.tags?.length || 0) > 4) && (
                          <span className="text-[10px] theme-muted">
                            +{(h.tracks?.length || 0) + (h.tags?.length || 0) - 4} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Registration Count */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Users size={12} />
                        {h.registration_count ?? 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/hackathons/${h.id}`}
                          className="p-1.5 rounded-lg border theme-divider hover:border-violet-500 hover:text-violet-500 transition-colors"
                          title="View Details & Registrations"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(h)}
                          className="p-1.5 rounded-lg border theme-divider hover:border-amber-500 hover:text-amber-500 transition-colors"
                          title="Edit Hackathon"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(h)}
                          disabled={deletingId === h.id}
                          className="p-1.5 rounded-lg border theme-divider hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete Hackathon"
                        >
                          <Trash2 size={14} className={deletingId === h.id ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
            Showing {hackathons.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, total)} of {total.toLocaleString()} hackathons
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

      {/* Create / Edit Modal */}
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
                <Calendar size={18} className="text-violet-500" />
                <h2 className="font-bold text-base theme-text">
                  {editingHackathon ? 'Edit Hackathon' : 'Create New Hackathon'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-500/10 theme-muted hover:theme-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold theme-text mb-1">
                  Hackathon Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI Nexus National Hackathon 2026"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.title ? 'border-red-500' : 'theme-divider'}`}
                  style={{ backgroundColor: 'var(--bg-raised)' }}
                />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>

              {/* Organizer & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Organizer *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google Cloud & IIT Bombay"
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
                    placeholder="e.g. Bengaluru, Karnataka (or Online)"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.location ? 'border-red-500' : 'theme-divider'}`}
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                </div>
              </div>

              {/* Dates */}
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

              {/* Prize & Team Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Prize Pool *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹5,00,000"
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
                    placeholder="e.g. 2-4"
                    value={formData.team_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, team_size: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.team_size ? 'border-red-500' : 'theme-divider'}`}
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  {formErrors.team_size && <p className="text-red-500 text-xs mt-1">{formErrors.team_size}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold theme-text mb-1">
                  Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the problem statements, judging criteria, and participant expectations..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border text-sm theme-text focus:outline-none focus:border-violet-500 ${formErrors.description ? 'border-red-500' : 'theme-divider'}`}
                  style={{ backgroundColor: 'var(--bg-raised)' }}
                />
                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
              </div>

              {/* Tracks & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Tracks (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI Agents, Web3, FinTech"
                    value={formData.tracks}
                    onChange={(e) => setFormData(prev => ({ ...prev, tracks: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  <span className="text-[11px] theme-muted mt-1 block">Separated by commas</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI/ML, Python, Cloud"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border theme-divider text-sm theme-text focus:outline-none focus:border-violet-500"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  />
                  <span className="text-[11px] theme-muted mt-1 block">Separated by commas</span>
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
                  {editingHackathon ? 'Save Changes' : 'Create Hackathon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
