// src/components/AvailabilityIndicator.jsx
const STATUS_MAP = {
  LOOKING_FOR_TEAM:    { color: '#10B981', label: 'Looking For Team',    pulse: true },
  OPEN_TO_INVITES:     { color: '#F59E0B', label: 'Open To Invitations', pulse: true },
  LOOKING_FOR_MEMBERS: { color: '#06B6D4', label: 'Looking For Members', pulse: true },
  IN_TEAM:             { color: '#EF4444', label: 'Already In Team',     pulse: false },
  OFFLINE:             { color: '#6B7280', label: 'Offline',             pulse: false },
}

export default function AvailabilityIndicator({ status, showLabel = true, size = 'sm' }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.OFFLINE
  const dotSize = size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'

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
        <span className="text-xs font-medium" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      )}
    </span>
  )
}
