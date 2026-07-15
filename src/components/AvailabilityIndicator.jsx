// src/components/AvailabilityIndicator.jsx
import { useTheme } from '../context/ThemeContext.jsx'

const STATUS_MAP = {
  LOOKING_FOR_TEAM:    { color: '#10B981', lightColor: '#047857', label: 'Looking For Team',    pulse: true },
  OPEN_TO_INVITES:     { color: '#F59E0B', lightColor: '#D97706', label: 'Open To Invitations', pulse: true },
  LOOKING_FOR_MEMBERS: { color: '#06B6D4', lightColor: '#0369A1', label: 'Looking For Members', pulse: true },
  IN_TEAM:             { color: '#EF4444', lightColor: '#B91C1C', label: 'Already In Team',     pulse: false },
  OFFLINE:             { color: '#6B7280', lightColor: '#475569', label: 'Offline',             pulse: false },
}

export default function AvailabilityIndicator({ status, showLabel = true, size = 'sm' }) {
  const { isDark } = useTheme()
  const cfg = STATUS_MAP[status] || STATUS_MAP.OFFLINE
  const dotSize = size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'
  const textColor = isDark ? cfg.color : cfg.lightColor

  return (
    <span className="inline-flex items-center gap-1.5" aria-label={cfg.label}>
      <span className="relative inline-flex">
        {cfg.pulse && (
          <span
            className={`absolute inline-flex rounded-full ${dotSize} animate-ping opacity-60`}
            style={{ backgroundColor: cfg.color }}
            aria-hidden="true"
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSize}`}
          style={{ backgroundColor: cfg.color }}
        />
      </span>
      {showLabel && (
        <span className="text-xs font-medium" style={{ color: textColor }}>
          {cfg.label}
        </span>
      )}
    </span>
  )
}
