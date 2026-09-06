// src/pages/admin/AdminStudentsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Search, Filter, CheckCircle2, XCircle, ShieldCheck,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Eye, Power,
  ArrowUpDown, ExternalLink
} from 'lucide-react'
import PulseAvatar from '../../components/PulseAvatar.jsx'
import { getAdminStudents, updateAdminStudentStatus } from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

export default function AdminStudentsPage() {
  const { push } = useToast()

  // Filters & Pagination State
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [totalPages, setTotalPages] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        page,
        limit,
        search: search.trim(),
        status: statusFilter || undefined,
        is_active: activeFilter !== '' ? activeFilter : undefined,
        is_verified: verifiedFilter !== '' ? verifiedFilter : undefined,
        college: collegeFilter.trim() || undefined,
        branch: branchFilter.trim() || undefined,
        year: yearFilter || undefined,
      }
      const data = await getAdminStudents(params)
      setStudents(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Failed to load students:', err)
      setError(err?.message || 'Failed to load students. Please verify server connection.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, activeFilter, verifiedFilter, collegeFilter, branchFilter, yearFilter])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchStudents()
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setActiveFilter('')
    setVerifiedFilter('')
    setCollegeFilter('')
    setBranchFilter('')
    setYearFilter('')
    setPage(1)
  }

  const handleToggleStatus = async (student) => {
    const nextStatus = !student.is_active
    const actionLabel = nextStatus ? 'activate' : 'deactivate'
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${student.name}'s account?`)) {
      return
    }

    try {
      setUpdatingId(student.id)
      await updateAdminStudentStatus(student.id, nextStatus)
      setStudents(prev =>
        prev.map(s => (s.id === student.id ? { ...s, is_active: nextStatus } : s))
      )
      push(`Student ${student.name} is now ${nextStatus ? 'active' : 'deactivated'}.`, 'success')
    } catch (err) {
      console.error(`Failed to ${actionLabel} student:`, err)
      push(`Failed to ${actionLabel} student: ${err.message}`, 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Users size={24} className="text-violet-500" />
            <h1 className="text-2xl font-bold theme-text tracking-tight">Student Management</h1>
          </div>
          <p className="theme-muted text-sm mt-1">
            Browse, inspect, and manage student accounts across the B2B2H platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
            Total: {total.toLocaleString()} Students
          </span>
          <button
            onClick={fetchStudents}
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
              placeholder="Search by student name, username, or email..."
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Account Active */}
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            <option value="">All Accounts</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>

          {/* Verification */}
          <select
            value={verifiedFilter}
            onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            <option value="">All Verification</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified Only</option>
          </select>

          {/* Availability Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            <option value="">All Availability</option>
            <option value="LOOKING_FOR_TEAM">Looking for Team</option>
            <option value="OPEN_TO_INVITES">Open to Invites</option>
            <option value="IN_TEAM">In Team</option>
            <option value="LOOKING_FOR_MEMBERS">Looking for Members</option>
            <option value="OFFLINE">Offline</option>
          </select>

          {/* Year */}
          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            <option value="">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Graduate">Graduate</option>
          </select>

          {/* College Filter Input */}
          <input
            type="text"
            placeholder="Filter college..."
            value={collegeFilter}
            onChange={(e) => { setCollegeFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          />

          {/* Branch Filter Input */}
          <input
            type="text"
            placeholder="Filter branch..."
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border theme-divider text-xs focus:outline-none focus:border-violet-500"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          />
        </div>

        {/* Clear Filters indicator */}
        {(search || statusFilter || activeFilter !== '' || verifiedFilter !== '' || collegeFilter || branchFilter || yearFilter) && (
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

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStudents}
            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Students Table */}
      <div
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b theme-divider text-xs uppercase tracking-wider text-slate-500 bg-[var(--bg-raised)]/50">
                <th className="py-3 px-4 font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">College & Academic</th>
                <th className="py-3 px-4 font-semibold">Availability</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold">Verification</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-divider">
              {loading && students.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm theme-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading students...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-sm theme-muted">
                    <Users size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold theme-text">No students matched your search criteria.</p>
                    <p className="text-xs mt-1">Try clearing some filters or searching for another term.</p>
                  </td>
                </tr>
              )}

              {students.map((student) => {
                const isTargetUpdating = updatingId === student.id
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-[var(--bg-raised)]/40 transition-colors"
                  >
                    {/* Student identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <PulseAvatar user={student} size="sm" showTooltip={false} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold theme-text text-sm truncate">{student.name}</span>
                            {student.is_admin && (
                              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/30">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs theme-muted truncate">@{student.username} · {student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Academic info */}
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-medium theme-text truncate max-w-[200px]" title={student.college || student.university || 'Not specified'}>
                        {student.college || student.university || '—'}
                      </p>
                      <p className="theme-muted truncate max-w-[200px]" title={`${student.branch || '—'} · ${student.year || '—'}`}>
                        {student.branch || 'General'} · {student.year || '—'}
                      </p>
                    </td>

                    {/* Availability */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40">
                        {student.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Account Status (Active/Deactivated) */}
                    <td className="py-3.5 px-4">
                      {student.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={13} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 dark:text-red-400">
                          <XCircle size={13} />
                          Deactivated
                        </span>
                      )}
                    </td>

                    {/* Verification */}
                    <td className="py-3.5 px-4">
                      {student.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                          <ShieldCheck size={12} />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/students/${student.id}`}
                          className="px-2.5 py-1.5 rounded-lg border theme-divider hover:bg-[var(--bg-raised)] text-xs font-semibold theme-text transition-colors flex items-center gap-1"
                        >
                          <Eye size={13} />
                          Details
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(student)}
                          disabled={isTargetUpdating}
                          title={student.is_active ? 'Deactivate Account' : 'Activate Account'}
                          className={`px-2 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 ${
                            student.is_active
                              ? 'border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                              : 'border-emerald-200 dark:border-emerald-900/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                          }`}
                        >
                          <Power size={12} />
                          {student.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          className="p-4 border-t theme-divider flex flex-col sm:flex-row items-center justify-between gap-3 text-xs theme-muted"
        >
          <div>
            Showing <span className="font-semibold theme-text">{students.length}</span> of{' '}
            <span className="font-semibold theme-text">{total}</span> students (Page{' '}
            <span className="font-semibold theme-text">{page}</span> of{' '}
            <span className="font-semibold theme-text">{totalPages}</span>)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border theme-divider hover:bg-[var(--bg-raised)] disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <span className="px-2 font-medium theme-text">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border theme-divider hover:bg-[var(--bg-raised)] disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-1"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
