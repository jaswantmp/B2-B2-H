// src/components/FilterPanel.jsx
import { useState, useEffect } from 'react'
import { getBuilders } from '../services/api.js'

const FEATURED_SKILLS = [
  'React', 'Node.js', 'Python', 'FastAPI', 'PyTorch', 'Agentic AI', 'Prompt Engineering',
  'SolidWorks', 'ROS2', 'MATLAB', 'Embedded C', 'STAAD Pro', 'ETABS', 'Revit',
  'Figma', 'Product Management', 'Cybersecurity', 'AWS', 'Docker', 'PLC', 'FPGA'
]


const STATUSES = [
  { value: 'LOOKING_FOR_TEAM',    label: 'Looking For Team',    color: '#10B981' },
  { value: 'OPEN_TO_INVITES',     label: 'Open To Invitations', color: '#F59E0B' },
  { value: 'LOOKING_FOR_MEMBERS', label: 'Looking For Members', color: '#06B6D4' },
  { value: 'IN_TEAM',             label: 'Already In Team',     color: '#EF4444' },
]

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold theme-muted uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}

function ChipGroup({ items, active, onToggle, getLabel = x => x, getValue = x => x }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => {
        const val = getValue(item)
        const on  = active.includes(val)
        return (
          <button
            key={val}
            onClick={() => onToggle(val)}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
              on ? 'bg-violet-700 border-violet-500 text-white' : 'theme-btn-ghost'
            }`}
            aria-pressed={on}
          >
            {getLabel(item)}
          </button>
        )
      })}
    </div>
  )
}

function SelectFilter({ id, label, options, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="theme-input w-full px-3 py-2 text-xs"
      >
        <option value="">All {label}s</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function FilterPanel({ filters, onChange }) {
  const [collegesList, setCollegesList] = useState([])
  const [citiesList, setCitiesList] = useState([])
  const [statesList, setStatesList] = useState([])

  useEffect(() => {
    let active = true
    getBuilders()
      .then(data => {
        if (!active || !Array.isArray(data)) return
        setCollegesList([...new Set(data.map(u => u.college).filter(Boolean))].sort())
        setCitiesList([...new Set(data.map(u => u.city).filter(Boolean))].sort())
        setStatesList([...new Set(data.map(u => u.state).filter(Boolean))].sort())
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('[FilterPanel] Could not load filter options:', err)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const toggle = (key, value) => {
    const current = filters[key] || []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  const setOne = (key, value) => {
    onChange({ ...filters, [key]: value ? [value] : [] })
  }

  const activeCollege = (filters.colleges || [])[0] || ''
  const activeCity    = (filters.cities   || [])[0] || ''
  const activeState   = (filters.states   || [])[0] || ''

  const totalActive =
    (filters.skills    || []).length +
    (filters.statuses  || []).length +
    (filters.colleges  || []).length +
    (filters.cities    || []).length +
    (filters.states    || []).length

  return (
    <aside className="space-y-5" aria-label="Filter builders">

      {/* Availability */}
      <Section title="Availability">
        <div className="space-y-2">
          {STATUSES.map(s => (
            <label key={s.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={(filters.statuses || []).includes(s.value)}
                onChange={() => toggle('statuses', s.value)}
                className="w-3.5 h-3.5 rounded accent-violet-600"
              />
              <span className="flex items-center gap-1.5 text-sm theme-text-secondary group-hover:theme-text transition-colors">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* Skills */}
      <Section title="Popular Skills">
        <ChipGroup
          items={FEATURED_SKILLS}
          active={filters.skills || []}
          onToggle={v => toggle('skills', v)}
        />
      </Section>

      {/* College — dropdown */}
      <Section title="College">
        <SelectFilter
          id="filter-college"
          label="College"
          options={collegesList}
          value={activeCollege}
          onChange={v => setOne('colleges', v)}
        />
      </Section>

      {/* City */}
      <Section title="City">
        <SelectFilter
          id="filter-city"
          label="City"
          options={citiesList}
          value={activeCity}
          onChange={v => setOne('cities', v)}
        />
      </Section>

      {/* State */}
      <Section title="State">
        <SelectFilter
          id="filter-state"
          label="State"
          options={statesList}
          value={activeState}
          onChange={v => setOne('states', v)}
        />
      </Section>


      {/* Clear */}
      {totalActive > 0 && (
        <button
          onClick={() => onChange({ skills: [], statuses: [], colleges: [], cities: [], states: [] })}
          className="text-xs theme-muted hover:text-red-400 transition-colors"
        >
          Clear all filters ({totalActive})
        </button>
      )}
    </aside>
  )
}

