// src/pages/DiscoverPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, X, Users, Search as SearchIcon, AlertTriangle, RefreshCw } from 'lucide-react'
import BuilderCard from '../components/BuilderCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import FilterPanel from '../components/FilterPanel.jsx'
import InviteModal from '../components/InviteModal.jsx'
import { getBuilders } from '../services/api.js'

const EMPTY_FILTERS = { skills: [], statuses: [], colleges: [], cities: [], states: [] }

// Count every active filter value across all filter keys
function countFilters(f) {
  return Object.values(f).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0)
}

// Render small pills for each active filter so users see what's applied
function ActiveFilterChips({ filters, onRemove }) {
  const chips = []
  Object.entries(filters).forEach(([key, arr]) => {
    if (!Array.isArray(arr)) return
    arr.forEach(val => chips.push({ key, val }))
  })
  if (!chips.length) return null

  const LABELS = {
    skills: 'Skill', statuses: 'Status', colleges: 'College', cities: 'City', states: 'State',
  }

  return (
    <div className="flex flex-wrap gap-1.5 mb-4" role="list" aria-label="Active filters">
      {chips.map(({ key, val }) => (
        <span
          key={`${key}-${val}`}
          role="listitem"
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium
            bg-violet-700/20 border border-violet-600/40 text-violet-400"
        >
          <span className="theme-muted text-xs">{LABELS[key]}:</span>
          {val.replace(/_/g, ' ')}
          <button
            onClick={() => onRemove(key, val)}
            aria-label={`Remove ${val} filter`}
            className="hover:text-red-400 transition-colors leading-none"
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}

export default function DiscoverPage() {
  const [builders, setBuilders]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [retryTrigger, setRetryTrigger] = useState(0)
  const [search, setSearch]           = useState('')
  const [filters, setFilters]         = useState(EMPTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [inviteUser, setInviteUser]   = useState(null)

  const totalFilters = countFilters(filters)

  const handleRetry = useCallback(() => {
    setRetryTrigger(prev => prev + 1)
  }, [])

  // Reload whenever search, filters, or retryTrigger changes (debounced 280ms)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const timer = setTimeout(async () => {
      try {
        const data = await getBuilders({ search, ...filters })
        if (!cancelled) {
          setBuilders(data || [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          console.warn('[DiscoverPage] Failed to fetch builders:', err)
          setError(err)
          setBuilders([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 280)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [search, filters, retryTrigger])

  const removeChip = useCallback((key, val) => {
    setFilters(f => ({ ...f, [key]: (f[key] || []).filter(v => v !== val) }))
  }, [])

  const clearAll = useCallback(() => {
    setSearch('')
    setFilters(EMPTY_FILTERS)
  }, [])

  const hasAnySearch = search.trim() !== '' || totalFilters > 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold theme-text mb-1">Discover Builders</h1>
        <p className="theme-muted text-sm">
          Search by name, college, city, state, skills, interests, bio, or anything else.
        </p>
      </div>

      {/* Search + filter toggle row */}
      <div className="flex items-center gap-3 mb-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search name, college, city, skill, bio…"
          className="flex-1 max-w-xl"
        />

        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex-shrink-0 ${
            totalFilters > 0
              ? 'bg-violet-700/20 border-violet-600/50 text-violet-400'
              : 'theme-btn-ghost'
          }`}
          aria-expanded={filtersOpen}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
          {totalFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">
              {totalFilters}
            </span>
          )}
        </button>

        {hasAnySearch && (
          <button
            onClick={clearAll}
            className="p-2 theme-muted hover:text-red-400 transition-colors flex-shrink-0"
            aria-label="Clear search and all filters"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips filters={filters} onRemove={removeChip} />

      <div className="flex gap-6">
        {/* Collapsible filter panel */}
        {filtersOpen && (
          <aside
            id="filter-panel"
            className="w-60 flex-shrink-0 rounded-xl p-4 h-fit sticky top-8 border theme-divider"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <FilterPanel filters={filters} onChange={setFilters} />
          </aside>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Result count + context */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm theme-muted">
              <Users size={14} aria-hidden="true" />
              {loading
                ? 'Searching…'
                : error
                ? 'Connection Error'
                : `${builders.length} builder${builders.length !== 1 ? 's' : ''} found`
              }
              {search && !loading && !error && (
                <span>
                  for{' '}
                  <span className="theme-text font-medium">"{search}"</span>
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="theme-skeleton h-52 animate-pulse" aria-hidden="true" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-24 rounded-2xl border theme-divider" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={24} className="text-amber-500" />
              </div>
              <h2 className="text-lg font-bold theme-text mb-1">Backend Unavailable</h2>
              <p className="theme-muted text-sm max-w-md mx-auto mb-6">
                The server might be starting up or offline.
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-600/20"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          ) : builders.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'var(--bg-raised)' }}>
                <SearchIcon size={24} className="theme-muted" />
              </div>
              <p className="theme-text font-medium mb-1">No builders found.</p>
              {(search || filters.skills?.length > 0 || filters.statuses?.length > 0 || filters.colleges?.length > 0 || filters.cities?.length > 0) ? (
                <>
                  <p className="theme-muted text-sm mb-4">
                    Try different keywords, a shorter query, or remove some filters.
                  </p>
                  <button
                    onClick={clearAll}
                    className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
                  >
                    Clear everything
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {builders.map(user => (
                <BuilderCard key={user.id} user={user} onInvite={setInviteUser} />
              ))}
            </div>
          )}
        </div>
      </div>

      {inviteUser && <InviteModal user={inviteUser} onClose={() => setInviteUser(null)} />}
    </div>
  )
}
