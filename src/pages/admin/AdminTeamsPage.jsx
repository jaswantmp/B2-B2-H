// src/pages/admin/AdminTeamsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  UsersRound, Search, Filter, RefreshCw, AlertCircle,
  Eye, Edit3, Trash2, Users, Mail, Trophy, Clock,
  X, Check, ChevronLeft, ChevronRight, AlertTriangle,
  ShieldAlert, Sparkles
} from 'lucide-react'
import PulseAvatar from '../../components/PulseAvatar.jsx'
import {
  getAdminTeams,
  updateAdminTeam,
  deleteAdminTeam
} from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

const STATUSES = [
  { key: '', label: 'All Statuses' },
  { key: 'recruiting', label: 'Recruiting' },
  { key: 'active', label: 'Active' },
  { key: 'full', label: 'Full' },
]

const STATUS_BADGES = {
  recruiting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  full: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
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

export default function AdminTeamsPage() {
  const { push } = useToast()

  // List & Filter States
  const [teams, setTeams] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // UI States
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState(null)

  // Edit / Moderation Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'recruiting',
    max_members: 5,
    hackathon_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminTeams({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      })
      setTeams(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Failed to load admin teams:', err)
      setError(err.message || 'Failed to load teams list. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchTeams()
  }

  // Open Edit Modal
  const handleOpenEdit = (team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name || '',
      description: team.description || '',
      status: team.status || 'recruiting',
      max_members: team.max_members || 5,
      hackathon_id: team.hackathon_id != null ? String(team.hackathon_id) : '',
    })
    setFormError('')
    setModalOpen(true)
  }

  // Submit Moderation
  const handleSaveModeration = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Team name is required.')
      return
    }

    const maxMemNum = parseInt(formData.max_members, 10)
    if (isNaN(maxMemNum) || maxMemNum < 2 || maxMemNum > 10) {
      setFormError('Team capacity must be between 2 and 10 members.')
      return
    }

    if (editingTeam && maxMemNum < editingTeam.member_count) {
      setFormError(`Capacity cannot be smaller than current member count (${editingTeam.member_count}).`)
      return
    }

    setSaving(true)
    setFormError('')

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      max_members: maxMemNum,
      hackathon_id: formData.hackathon_id.trim() ? parseInt(formData.hackathon_id.trim(), 10) : null,
    }

    try {
      await updateAdminTeam(editingTeam.id, payload)
      push('Team updated successfully.', 'success')
      setModalOpen(false)
      fetchTeams()
    } catch (err) {
      console.error('Failed to update team:', err)
      setFormError(err.message || 'Failed to update team.')
    } finally {
      setSaving(false)
    }
  }

  // Safe Deletion Handlers
  const handleOpenDeleteConfirm = (team) => {
    setDeleteConfirmTeam(team)
  }

  const handleExecuteDelete = async () => {
    if (!deleteConfirmTeam) return
    const teamId = deleteConfirmTeam.id
    const teamName = deleteConfirmTeam.name

    setDeletingId(teamId)
    try {
      await deleteAdminTeam(teamId)
      push(`Team "${teamName}" deleted successfully.`, 'success')
      setDeleteConfirmTeam(null)
      fetchTeams()
    } catch (err) {
      console.error('Failed to delete team:', err)
      push(err.message || 'Failed to delete team.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight theme-text">Team Management</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              {total} Total
            </span>
          </div>
          <p className="text-sm theme-muted mt-1">
            Audit hackathon teams, inspect builders and leader assignments, manage capacities, and track invites.
          </p>
        </div>

        <button
          onClick={fetchTeams}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border theme-divider hover:bg-black/5 dark:hover:bg-white/5 transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="p-4 rounded-2xl border theme-divider shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by team name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="pl-3 pr-8 py-2 text-sm rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer"
              >
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key} className="theme-bg theme-text">
                    {s.label}
                  </option>
                ))}
              </select>
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            >
              Search
            </button>

            {(search || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('')
                  setPage(1)
                }}
                className="px-3 py-2 rounded-xl text-sm font-medium border theme-divider hover:bg-black/5 dark:hover:bg-white/5 transition-colors theme-muted hover:theme-text"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button
            onClick={fetchTeams}
            className="text-xs underline hover:no-underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Teams Table */}
      <div
        className="rounded-2xl border theme-divider overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b theme-divider bg-black/[0.02] dark:bg-white/[0.02]">
              <tr className="theme-muted font-medium text-xs">
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Leader</th>
                <th className="py-3 px-4 text-center">Capacity</th>
                <th className="py-3 px-4 text-center">Invites</th>
                <th className="py-3 px-4">Hackathon</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-divider">
              {loading && teams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center theme-muted">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Loading teams...</p>
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center theme-muted">
                    <UsersRound size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-sm">No teams found.</p>
                    <p className="text-xs mt-1">Try adjusting your search criteria or filters.</p>
                  </td>
                </tr>
              ) : (
                teams.map((team) => {
                  const statusClass = STATUS_BADGES[team.status] || STATUS_BADGES.recruiting
                  const capacityPercent = Math.min(100, Math.round(((team.member_count || 0) / (team.max_members || 5)) * 100))

                  return (
                    <tr
                      key={team.id}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Team Name & Description */}
                      <td className="py-3 px-4">
                        <div className="max-w-[220px]">
                          <Link
                            to={`/admin/teams/${team.id}`}
                            className="font-semibold text-sm theme-text hover:text-amber-500 transition-colors line-clamp-1"
                          >
                            {team.name}
                          </Link>
                          {team.description ? (
                            <p className="text-xs theme-muted line-clamp-1 mt-0.5">{team.description}</p>
                          ) : (
                            <span className="text-[11px] theme-muted italic">No description</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${statusClass}`}>
                          {team.status}
                        </span>
                      </td>

                      {/* Leader */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <PulseAvatar
                            name={team.leader?.name || 'User'}
                            src={team.leader?.avatar}
                            size={28}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium theme-text truncate">
                              {team.leader?.name || 'Unknown'}
                            </p>
                            <p className="text-[11px] theme-muted truncate">
                              @{team.leader?.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Capacity & Progress */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-semibold theme-text">
                            {team.member_count || 0} / {team.max_members || 5}
                          </span>
                          <div className="w-14 h-1.5 rounded-full bg-black/10 dark:bg-white/10 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                capacityPercent >= 100 ? 'bg-purple-500' : capacityPercent >= 60 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${capacityPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Invites */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Mail size={11} />
                          {team.invite_count || 0}
                        </span>
                      </td>

                      {/* Hackathon */}
                      <td className="py-3 px-4">
                        {team.hackathon_id ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium theme-muted">
                            <Trophy size={12} className="text-amber-500" />
                            #{team.hackathon_id}
                          </span>
                        ) : (
                          <span className="text-xs theme-muted">—</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-4 text-xs theme-muted whitespace-nowrap">
                        {formatDate(team.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/admin/teams/${team.id}`}
                            className="p-1.5 rounded-lg border theme-divider hover:bg-black/5 dark:hover:bg-white/5 text-sky-600 dark:text-sky-400 transition-colors"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </Link>

                          <button
                            onClick={() => handleOpenEdit(team)}
                            className="p-1.5 rounded-lg border theme-divider hover:bg-black/5 dark:hover:bg-white/5 text-amber-600 dark:text-amber-400 transition-colors"
                            title="Moderate Team"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleOpenDeleteConfirm(team)}
                            className="p-1.5 rounded-lg border theme-divider hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors"
                            title="Delete Team"
                          >
                            <Trash2 size={15} />
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
        <div className="p-4 border-t theme-divider flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs theme-muted">
          <div>
            Showing <span className="font-semibold theme-text">{teams.length}</span> of{' '}
            <span className="font-semibold theme-text">{total}</span> teams
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="mr-1">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border theme-divider hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border theme-divider hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Moderate Team Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border theme-divider shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b theme-divider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-amber-500" />
                <h3 className="font-bold text-base theme-text">Moderate Team</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg theme-muted hover:theme-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModeration} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-1.5">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="e.g., Cloud Titans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="Short description of the team's mission or track..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50 capitalize"
                  >
                    <option value="recruiting" className="theme-bg theme-text">Recruiting</option>
                    <option value="active" className="theme-bg theme-text">Active</option>
                    <option value="full" className="theme-bg theme-text">Full</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-1.5">
                    Max Members (2 - 10)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={formData.max_members}
                    onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  {editingTeam && (
                    <p className="text-[11px] theme-muted mt-1">
                      Current members: {editingTeam.member_count || 0}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-1.5">
                  Hackathon ID (Optional)
                </label>
                <input
                  type="number"
                  value={formData.hackathon_id}
                  onChange={(e) => setFormData({ ...formData, hackathon_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="e.g. 1"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>
                  Admin moderation strictly modifies team metadata only. Leader ownership, builder memberships, and individual student accounts remain untouched.
                </span>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border theme-divider hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {saving && <RefreshCw size={14} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-2xl border theme-divider shadow-2xl overflow-hidden p-6 space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base theme-text">Confirm Team Deletion</h3>
                <p className="text-xs theme-muted">Safe Deletion Policy Enforced</p>
              </div>
            </div>

            <p className="text-sm theme-text">
              Are you sure you want to delete team <strong className="font-bold">{deleteConfirmTeam.name}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border theme-divider text-xs theme-muted space-y-1">
              <p>• <strong>Invitations Check:</strong> Deletion is rejected (HTTP 409) if any active or historical invitations exist.</p>
              <p>• <strong>Collaborator Check:</strong> Deletion is rejected (HTTP 409) if any collaborator members belong to this team.</p>
              <p>• Only disposable teams with 0 collaborator members and 0 invites can be safely deleted.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTeam(null)}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-xl border theme-divider hover:bg-black/5 dark:hover:bg-white/5 font-medium text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deletingId !== null}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                {deletingId !== null && <RefreshCw size={14} className="animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
