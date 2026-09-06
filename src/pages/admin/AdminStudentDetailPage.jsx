// src/pages/admin/AdminStudentDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, User, ShieldCheck, CheckCircle2, XCircle,
  FolderOpen, UsersRound, Calendar, RefreshCw, AlertCircle,
  ExternalLink, Github, Linkedin, Twitter, Globe, MapPin,
  GraduationCap, Award, Power, Sparkles, Tag
} from 'lucide-react'
import PulseAvatar from '../../components/PulseAvatar.jsx'
import { getAdminStudent, updateAdminStudentStatus, updateAdminStudentVerification } from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

export default function AdminStudentDetailPage() {
  const { studentId } = useParams()
  const { push } = useToast()

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchStudent = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminStudent(studentId)
      setStudent(data)
    } catch (err) {
      console.error('Failed to load student details:', err)
      setError(err?.message || 'Failed to load student details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudent()
  }, [studentId])

  const handleToggleActive = async () => {
    if (!student) return
    const nextStatus = !student.is_active
    const actionLabel = nextStatus ? 'activate' : 'deactivate'
    if (!window.confirm(`Are you sure you want to ${actionLabel} this student's account?`)) {
      return
    }

    try {
      setUpdating(true)
      await updateAdminStudentStatus(student.id, nextStatus)
      setStudent(prev => ({ ...prev, is_active: nextStatus }))
      push(`Account successfully ${nextStatus ? 'activated' : 'deactivated'}.`, 'success')
    } catch (err) {
      push(`Failed to update account status: ${err.message}`, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleVerification = async () => {
    if (!student) return
    const nextVerification = !student.is_verified
    try {
      setUpdating(true)
      await updateAdminStudentVerification(student.id, nextVerification)
      setStudent(prev => ({ ...prev, is_verified: nextVerification }))
      push(`Verification status updated to ${nextVerification ? 'Verified' : 'Unverified'}.`, 'success')
    } catch (err) {
      push(`Failed to update verification status: ${err.message}`, 'error')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm theme-muted">Loading student details...</p>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-2 text-sm text-violet-500 hover:text-violet-400 font-medium"
        >
          <ArrowLeft size={16} />
          Back to Students
        </Link>
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400">
          <AlertCircle size={24} className="mb-2" />
          <h3 className="font-bold text-base">Error Loading Student</h3>
          <p className="text-sm mt-1">{error || 'Student not found.'}</p>
          <button
            onClick={fetchStudent}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
        >
          <ArrowLeft size={16} />
          Back to All Students
        </Link>
        <span className="text-xs font-mono text-slate-400">ID: {student.id}</span>
      </div>

      {/* Main Profile Header Card */}
      <div
        className="rounded-2xl p-6 border shadow-sm space-y-6"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PulseAvatar user={student} size="lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold theme-text">{student.name}</h1>
                {student.is_admin && (
                  <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/30">
                    Admin
                  </span>
                )}
                {student.is_verified && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/30 flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm theme-muted">@{student.username} · {student.email}</p>
              <div className="flex items-center gap-2 mt-1.5 text-xs theme-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <GraduationCap size={14} />
                  {student.college || student.university || 'No College Specified'}
                </span>
                <span>•</span>
                <span>{student.branch || 'General'}</span>
                <span>•</span>
                <span>{student.year || 'Year N/A'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={handleToggleVerification}
              disabled={updating}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                student.is_verified
                  ? 'border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/20'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[var(--bg-raised)]'
              }`}
            >
              <ShieldCheck size={14} />
              {student.is_verified ? 'Revoke Verification' : 'Mark as Verified'}
            </button>

            <button
              onClick={handleToggleActive}
              disabled={updating}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                student.is_active
                  ? 'border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                  : 'border-emerald-200 dark:border-emerald-900/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
              }`}
            >
              <Power size={14} />
              {student.is_active ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>
        </div>

        {/* Bio */}
        {student.bio && (
          <div className="p-4 rounded-xl bg-[var(--bg-raised)]/40 border theme-divider text-sm theme-text-secondary leading-relaxed">
            {student.bio}
          </div>
        )}

        {/* Overview Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl border theme-divider bg-[var(--bg-raised)]">
            <span className="text-[10px] uppercase font-bold theme-muted tracking-wider block">Account Status</span>
            <span className={`text-sm font-bold mt-0.5 inline-flex items-center gap-1 ${
              student.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}>
              {student.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {student.is_active ? 'Active' : 'Deactivated'}
            </span>
          </div>

          <div className="p-3 rounded-xl border theme-divider bg-[var(--bg-raised)]">
            <span className="text-[10px] uppercase font-bold theme-muted tracking-wider block">Availability</span>
            <span className="text-sm font-bold theme-text mt-0.5 block">
              {student.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="p-3 rounded-xl border theme-divider bg-[var(--bg-raised)]">
            <span className="text-[10px] uppercase font-bold theme-muted tracking-wider block">Hackathons Won</span>
            <span className="text-sm font-bold theme-text mt-0.5 flex items-center gap-1">
              <Award size={14} className="text-amber-500" />
              {student.hackathons_won || 0}
            </span>
          </div>

          <div className="p-3 rounded-xl border theme-divider bg-[var(--bg-raised)]">
            <span className="text-[10px] uppercase font-bold theme-muted tracking-wider block">Joined Date</span>
            <span className="text-sm font-bold theme-text mt-0.5 block">
              {student.joined_at ? new Date(student.joined_at).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div
        className="rounded-2xl p-6 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold theme-text flex items-center gap-2">
            <Sparkles size={18} className="text-violet-500" />
            Skills ({student.skills ? student.skills.length : 0})
          </h2>
        </div>

        {student.skills && student.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {student.skills.map((s) => (
              <div
                key={s.id || s.skill_id}
                className="px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 text-xs flex items-center gap-2"
              >
                <span className="font-semibold text-violet-800 dark:text-violet-300">{s.name}</span>
                {s.proficiency && (
                  <span className="text-[10px] uppercase text-violet-600 dark:text-violet-400 font-medium">
                    ({s.proficiency})
                  </span>
                )}
                {s.is_verified && (
                  <ShieldCheck size={12} className="text-cyan-500" title="Verified Skill" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm theme-muted italic">No skills listed for this student.</p>
        )}
      </div>

      {/* Projects Section */}
      <div
        className="rounded-2xl p-6 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold theme-text flex items-center gap-2">
            <FolderOpen size={18} className="text-amber-500" />
            Projects ({student.projects ? student.projects.length : 0})
          </h2>
        </div>

        {student.projects && student.projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {student.projects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border theme-divider bg-[var(--bg-raised)]/30 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/projects/${p.id}`}
                    className="font-bold text-sm theme-text hover:text-amber-500 transition-colors truncate"
                    title="View Project Details"
                  >
                    {p.title}
                  </Link>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs theme-muted">
                  <span>Role: {p.role || 'Contributor'}</span>
                  {p.is_creator && (
                    <span className="text-violet-600 dark:text-violet-400 font-bold">• Creator</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm theme-muted italic">No projects found for this student.</p>
        )}
      </div>

      {/* Teams Section */}
      <div
        className="rounded-2xl p-6 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold theme-text flex items-center gap-2">
            <UsersRound size={18} className="text-indigo-500" />
            Teams ({student.teams ? student.teams.length : 0})
          </h2>
        </div>

        {student.teams && student.teams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {student.teams.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl border theme-divider bg-[var(--bg-raised)]/30 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/teams/${t.id}`}
                    className="font-bold text-sm theme-text hover:text-amber-500 transition-colors truncate"
                    title="View Team Details"
                  >
                    {t.name}
                  </Link>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 shrink-0">
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs theme-muted">
                  <span>Role: {t.role || 'Member'}</span>
                  {t.is_leader && (
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">• Team Lead</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm theme-muted italic">No teams associated with this student.</p>
        )}
      </div>

      {/* Hackathons Section */}
      <div
        className="rounded-2xl p-6 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold theme-text flex items-center gap-2">
            <Calendar size={18} className="text-pink-500" />
            Hackathons Registered ({student.hackathons ? student.hackathons.length : 0})
          </h2>
        </div>

        {student.hackathons && student.hackathons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {student.hackathons.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-xl border theme-divider bg-[var(--bg-raised)]/30 space-y-1.5"
              >
                <Link
                  to={`/admin/hackathons/${h.id}`}
                  className="font-bold text-sm theme-text hover:text-amber-500 transition-colors truncate block"
                  title="View Hackathon Details"
                >
                  {h.title}
                </Link>
                <p className="text-xs theme-muted truncate">Organizer: {h.organizer} · {h.location}</p>
                <p className="text-[11px] text-slate-400">
                  Registered on {new Date(h.registered_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm theme-muted italic">No hackathon registrations for this student.</p>
        )}
      </div>
    </div>
  )
}
