// src/pages/admin/AdminTeamDetailPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, UsersRound, Users, Mail, Trophy, Clock,
  Edit3, Trash2, RefreshCw, AlertCircle, Search, ExternalLink,
  ShieldCheck, CheckCircle2, GraduationCap, X, MapPin,
  Sparkles, ShieldAlert, AlertTriangle, Activity, UserCheck
} from 'lucide-react'
import PulseAvatar from '../../components/PulseAvatar.jsx'
import {
  getAdminTeam,
  updateAdminTeam,
  deleteAdminTeam
} from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

const STATUS_BADGES = {
  recruiting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  full: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
}

const INVITE_STATUS_BADGES = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  declined: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
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

export default function AdminTeamDetailPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()

  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Sub-tab: 'members' | 'invites'
  const [activeTab, setActiveTab] = useState('members')
  const [memberSearch, setMemberSearch] = useState('')
  const [inviteSearch, setInviteSearch] = useState('')

  // Moderation Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'recruiting',
    max_members: 5,
    hackathon_id: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const fetchTeamDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminTeam(teamId)
      setTeam(data)
    } catch (err) {
      console.error('Failed to load team details:', err)
      setError(err?.message || 'Failed to load team details.')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    fetchTeamDetails()
  }, [fetchTeamDetails])

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!team) return
    setFormData({
      name: team.name || '',
      description: team.description || '',
      status: team.status || 'recruiting',
      max_members: team.max_members || 5,
      hackathon_id: team.hackathon_id != null ? String(team.hackathon_id) : '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  // Submit Moderation
  const handleSaveModeration = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Team name is required.'

    const maxMemNum = parseInt(formData.max_members, 10)
    if (isNaN(maxMemNum) || maxMemNum < 2 || maxMemNum > 10) {
      errors.max_members = 'Team capacity must be between 2 and 10 members.'
    } else if (team && maxMemNum < (team.members?.length || 0)) {
      errors.max_members = `Capacity cannot be smaller than current member count (${team.members?.length || 0}).`
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      setFormErrors({})

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        max_members: maxMemNum,
        hackathon_id: formData.hackathon_id.trim() ? parseInt(formData.hackathon_id.trim(), 10) : null,
      }

      const updated = await updateAdminTeam(teamId, payload)
      setTeam(updated)
      setModalOpen(false)
      push('Team moderated successfully.', 'success')
    } catch (err) {
      console.error('Moderation failed:', err)
      setFormErrors({ form: err?.message || 'Failed to update team.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Safe Deletion Handlers
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true)
      await deleteAdminTeam(teamId)
      push(`Team "${team.name}" deleted successfully.`, 'success')
      navigate('/admin/teams', { replace: true })
    } catch (err) {
      console.error('Delete failed:', err)
      push(err?.message || 'Failed to delete team.', 'error')
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  // Filtered lists
  const filteredMembers = (team?.members || []).filter(m => {
    if (!memberSearch.trim()) return true
    const q = memberSearch.toLowerCase()
    return (
      m.name?.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    )
  })

  const filteredInvites = (team?.invites || []).filter(inv => {
    if (!inviteSearch.trim()) return true
    const q = inviteSearch.toLowerCase()
    return (
      inv.name?.toLowerCase().includes(q) ||
      inv.username?.toLowerCase().includes(q) ||
      inv.email?.toLowerCase().includes(q) ||
      inv.role?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center theme-muted gap-3">
        <RefreshCw size={28} className="animate-spin text-amber-500" />
        <p className="text-sm font-medium">Loading team profile...</p>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/teams"
          className="inline-flex items-center gap-2 text-sm theme-muted hover:theme-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Teams</span>
        </Link>
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-base">Error Loading Team</h3>
            <p className="text-sm mt-1">{error || 'Team not found.'}</p>
            <button
              onClick={fetchTeamDetails}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors"
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const statusBadge = STATUS_BADGES[team.status] || STATUS_BADGES.recruiting
  const memberCount = team.members?.length || 0
  const maxMembers = team.max_members || 5
  const capacityPercent = Math.min(100, Math.round((memberCount / maxMembers) * 100))

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/teams"
            className="p-2 rounded-xl border theme-divider hover:bg-black/5 dark:hover:bg-white/5 theme-muted hover:theme-text transition-colors"
            title="Back to Teams"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold theme-muted uppercase tracking-wider">
                Team Details
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${statusBadge}`}>
                {team.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight theme-text mt-0.5">
              {team.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchTeamDetails}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border theme-divider hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Refresh Details"
          >
            <RefreshCw size={15} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
          >
            <Edit3 size={15} />
            <span>Moderate</span>
          </button>

          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Status */}
        <div
          className="p-4 rounded-2xl border theme-divider shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <p className="text-xs font-medium theme-muted">Recruitment Status</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold capitalize theme-text">{team.status}</span>
            <div className={`p-2 rounded-xl ${statusBadge}`}>
              <UsersRound size={18} />
            </div>
          </div>
          <p className="text-[11px] theme-muted mt-1.5">
            {team.status === 'recruiting' ? 'Accepting invitations' : team.status === 'full' ? 'At capacity' : 'Ready for hackathon'}
          </p>
        </div>

        {/* Capacity */}
        <div
          className="p-4 rounded-2xl border theme-divider shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <p className="text-xs font-medium theme-muted">Member Capacity</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold theme-text">
              {memberCount} / {maxMembers}
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Users size={18} />
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPercent >= 100 ? 'bg-purple-500' : capacityPercent >= 60 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Invitations */}
        <div
          className="p-4 rounded-2xl border theme-divider shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <p className="text-xs font-medium theme-muted">Sent Invitations</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold theme-text">{team.invites?.length || 0}</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Mail size={18} />
            </div>
          </div>
          <p className="text-[11px] theme-muted mt-1.5">
            {(team.invites || []).filter(i => i.status === 'pending').length} pending response
          </p>
        </div>

        {/* Hackathon Link */}
        <div
          className="p-4 rounded-2xl border theme-divider shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <p className="text-xs font-medium theme-muted">Target Hackathon</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold theme-text">
              {team.hackathon_id ? `#${team.hackathon_id}` : 'General'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy size={18} />
            </div>
          </div>
          <p className="text-[11px] theme-muted mt-1.5">
            {team.hackathon_id ? (
              <Link to={`/admin/hackathons/${team.hackathon_id}`} className="text-amber-500 hover:underline font-semibold">
                View Hackathon #{team.hackathon_id}
              </Link>
            ) : 'No hackathon attached'}
          </p>
        </div>
      </div>

      {/* Main Grid: Left Team Details & ML Health, Right Leader Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & ML Team Health */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description & Metadata Card */}
          <div
            className="p-6 rounded-2xl border theme-divider shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <h2 className="text-base font-bold theme-text flex items-center gap-2">
              <span>About Team</span>
            </h2>
            <p className="text-sm theme-text leading-relaxed whitespace-pre-wrap">
              {team.description || <span className="theme-muted italic">No team description provided.</span>}
            </p>

            <div className="pt-4 border-t theme-divider flex flex-wrap items-center gap-6 text-xs theme-muted">
              <div>
                <span className="font-medium">Created: </span>
                <span>{formatDate(team.created_at)}</span>
              </div>
              <div>
                <span className="font-medium">Updated: </span>
                <span>{formatDate(team.updated_at)}</span>
              </div>
              <div>
                <span className="font-medium">Team ID: </span>
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 theme-text font-mono">
                  {team.id}
                </code>
              </div>
            </div>
          </div>

          {/* ML Team Health Card (Read-only) */}
          <div
            className="p-6 rounded-2xl border theme-divider shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold theme-text">ML Team Health Analysis</h2>
                  <p className="text-xs theme-muted">Dynamic skill synergy & composition evaluation</p>
                </div>
              </div>

              {team.health_status && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 self-start sm:self-auto">
                  <Sparkles size={12} />
                  {team.health_status}
                </span>
              )}
            </div>

            {/* Health Scores Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {['Frontend', 'Backend', 'AI/ML', 'Design', 'Product'].map((cat) => {
                const score = team.health_scores?.[cat] ?? 0
                return (
                  <div
                    key={cat}
                    className="p-3 rounded-xl border theme-divider bg-black/[0.02] dark:bg-white/[0.02] text-center"
                  >
                    <p className="text-[11px] font-medium theme-muted">{cat}</p>
                    <p className="text-lg font-bold theme-text mt-1">{score}%</p>
                    <div className="w-full h-1 rounded-full bg-black/10 dark:bg-white/10 mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Missing Roles */}
            {team.missing_roles && team.missing_roles.length > 0 && (
              <div className="pt-3 border-t theme-divider">
                <p className="text-xs font-semibold theme-muted mb-2">Recommended Missing Roles:</p>
                <div className="flex flex-wrap gap-1.5">
                  {team.missing_roles.map((role) => (
                    <span
                      key={role}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                    >
                      + {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-[11px] theme-muted flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Read-only dynamic ML evaluation. Preserves all existing models and weights without modification.</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Leader Card */}
        <div className="space-y-6">
          <div
            className="p-6 rounded-2xl border theme-divider shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <h2 className="text-base font-bold theme-text flex items-center gap-2">
              <UserCheck size={18} className="text-amber-500" />
              <span>Team Leader</span>
            </h2>

            <div className="flex items-center gap-3">
              <PulseAvatar
                name={team.leader?.name || 'Leader'}
                src={team.leader?.avatar}
                size={48}
              />
              <div className="min-w-0">
                <h3 className="text-sm font-bold theme-text truncate">
                  {team.leader?.name || 'Unknown'}
                </h3>
                <p className="text-xs theme-muted truncate">@{team.leader?.username}</p>
                <p className="text-xs theme-muted truncate mt-0.5">{team.leader?.email}</p>
              </div>
            </div>

            <div className="pt-3 border-t theme-divider space-y-2 text-xs">
              {team.leader?.college && (
                <div className="flex items-center gap-2 theme-muted">
                  <GraduationCap size={14} className="shrink-0" />
                  <span className="truncate">{team.leader.college}</span>
                </div>
              )}
              {team.leader?.branch && (
                <div className="flex items-center gap-2 theme-muted">
                  <span className="w-3.5 text-center font-bold">•</span>
                  <span className="truncate">{team.leader.branch} ({team.leader.year || 'N/A'})</span>
                </div>
              )}
            </div>

            <Link
              to={`/admin/students/${team.leader?.id}`}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border theme-divider hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold theme-text transition-colors mt-2"
            >
              <span>View Leader Student Profile</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Sub-tabs: Members & Invitations */}
      <div
        className="rounded-2xl border theme-divider overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Tab Headers */}
        <div className="border-b theme-divider flex items-center px-4 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent theme-muted hover:theme-text'
            }`}
          >
            <Users size={16} />
            <span>Team Members ({team.members?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'invites'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent theme-muted hover:theme-text'
            }`}
          >
            <Mail size={16} />
            <span>Invitations ({team.invites?.length || 0})</span>
          </button>
        </div>

        {/* Tab Body: Members */}
        {activeTab === 'members' && (
          <div className="p-4 space-y-4">
            {/* Search filter for members */}
            <div className="relative max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Filter members by name, username, or role..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {filteredMembers.length === 0 ? (
              <div className="py-8 text-center theme-muted text-xs">
                No team members match your filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b theme-divider bg-black/[0.02] dark:bg-white/[0.02]">
                    <tr className="theme-muted font-medium text-xs">
                      <th className="py-2.5 px-4">Member</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Academic Details</th>
                      <th className="py-2.5 px-4">Joined</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-divider text-xs">
                    {filteredMembers.map((m) => {
                      const isLeader = m.student_id === team.leader_id
                      return (
                        <tr key={m.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <PulseAvatar name={m.name} src={m.avatar} size={32} />
                              <div>
                                <p className="font-semibold theme-text flex items-center gap-1.5">
                                  {m.name}
                                  {isLeader && (
                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      Leader
                                    </span>
                                  )}
                                </p>
                                <p className="theme-muted">{m.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {m.role}
                            </span>
                          </td>

                          <td className="py-3 px-4 theme-muted">
                            <p className="truncate max-w-[200px]">{m.college || '—'}</p>
                            <p className="text-[11px] truncate max-w-[200px]">
                              {m.branch ? `${m.branch} (${m.year || 'N/A'})` : '—'}
                            </p>
                          </td>

                          <td className="py-3 px-4 theme-muted whitespace-nowrap">
                            {formatDate(m.joined_at)}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/admin/students/${m.student_id}`}
                              className="p-1.5 rounded-lg border theme-divider hover:bg-black/5 dark:hover:bg-white/5 text-sky-600 dark:text-sky-400 inline-flex items-center"
                              title="View Student"
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Body: Invitations */}
        {activeTab === 'invites' && (
          <div className="p-4 space-y-4">
            {/* Search filter for invites */}
            <div className="relative max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Filter invitations by student name, role, status..."
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {filteredInvites.length === 0 ? (
              <div className="py-8 text-center theme-muted text-xs">
                No invitations found for this team.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b theme-divider bg-black/[0.02] dark:bg-white/[0.02]">
                    <tr className="theme-muted font-medium text-xs">
                      <th className="py-2.5 px-4">Invited Builder</th>
                      <th className="py-2.5 px-4">Offered Role</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Message</th>
                      <th className="py-2.5 px-4">Sent Date</th>
                      <th className="py-2.5 px-4 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-divider text-xs">
                    {filteredInvites.map((inv) => {
                      const inviteStatusClass = INVITE_STATUS_BADGES[inv.status] || INVITE_STATUS_BADGES.pending
                      return (
                        <tr key={inv.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <PulseAvatar name={inv.name} src={inv.avatar} size={30} />
                              <div>
                                <p className="font-semibold theme-text">{inv.name}</p>
                                <p className="theme-muted">{inv.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium theme-text">{inv.role}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${inviteStatusClass}`}>
                              {inv.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 theme-muted max-w-[200px] truncate">
                            {inv.message || <span className="italic">—</span>}
                          </td>

                          <td className="py-3 px-4 theme-muted whitespace-nowrap">
                            {formatDate(inv.created_at)}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/admin/students/${inv.student_id}`}
                              className="p-1.5 rounded-lg border theme-divider hover:bg-black/5 dark:hover:bg-white/5 text-sky-600 dark:text-sky-400 inline-flex items-center"
                              title="View Student"
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Moderation Modal */}
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
              {formErrors.form && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formErrors.form}</span>
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
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>
                )}
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
                  placeholder="Short description of the team..."
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
                    Max Capacity (2 - 10)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={formData.max_members}
                    onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border theme-divider bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  {formErrors.max_members && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.max_members}</p>
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
                  Admin moderation strictly modifies team metadata only. Leader ownership and member records remain unaffected.
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
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
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
              Are you sure you want to delete team <strong className="font-bold">{team.name}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border theme-divider text-xs theme-muted space-y-1">
              <p>• <strong>Invitations Check:</strong> Deletion is rejected (HTTP 409) if any invitations exist.</p>
              <p>• <strong>Collaborator Check:</strong> Deletion is rejected (HTTP 409) if any collaborator members belong to this team.</p>
              <p>• Only empty teams with 0 collaborators and 0 invites can be safely deleted.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border theme-divider hover:bg-black/5 dark:hover:bg-white/5 font-medium text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                {deleting && <RefreshCw size={14} className="animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
