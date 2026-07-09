// src/components/PulseAvatar.jsx
// The signature element of B2B2H — every avatar carries a live availability ring.

const STATUS_CONFIG = {
  LOOKING_FOR_TEAM:    { ring: '#10B981', label: 'Looking For Team',    pulse: true  },
  OPEN_TO_INVITES:     { ring: '#F59E0B', label: 'Open To Invitations', pulse: true  },
  LOOKING_FOR_MEMBERS: { ring: '#06B6D4', label: 'Looking For Members', pulse: true  },
  IN_TEAM:             { ring: '#EF4444', label: 'Already In Team',     pulse: false },
  OFFLINE:             { ring: '#6B7280', label: 'Offline',             pulse: false },
}

export default function PulseAvatar({ user, size = 'md', showTooltip = true, className = '' }) {
  const config = STATUS_CONFIG[user?.status] || STATUS_CONFIG.OFFLINE
  const ring = config.ring

  const sizes = {
    xs:  { wrap: 'w-7 h-7',    img: 'w-7 h-7',    ringOuter: '-inset-0.5', dot: 'w-2 h-2 -bottom-0 -right-0' },
    sm:  { wrap: 'w-9 h-9',    img: 'w-9 h-9',    ringOuter: '-inset-0.5', dot: 'w-2.5 h-2.5 -bottom-0 -right-0' },
    md:  { wrap: 'w-11 h-11',  img: 'w-11 h-11',  ringOuter: '-inset-1',   dot: 'w-3 h-3 bottom-0 right-0' },
    lg:  { wrap: 'w-16 h-16',  img: 'w-16 h-16',  ringOuter: '-inset-1',   dot: 'w-3.5 h-3.5 bottom-0.5 right-0.5' },
    xl:  { wrap: 'w-24 h-24',  img: 'w-24 h-24',  ringOuter: '-inset-1.5', dot: 'w-4 h-4 bottom-1 right-1' },
    '2xl':{ wrap: 'w-32 h-32', img: 'w-32 h-32',  ringOuter: '-inset-2',   dot: 'w-5 h-5 bottom-1 right-1' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={`relative inline-flex flex-shrink-0 ${s.wrap} ${className}`} title={showTooltip ? config.label : undefined}>
      {/* Pulse animation ring */}
      {config.pulse && (
        <span
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{ border: `2px solid ${ring}`, borderRadius: '50%' }}
          aria-hidden="true"
        />
      )}
      {/* Static ring */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ border: `2px solid ${ring}`, borderRadius: '50%', opacity: config.pulse ? 0.7 : 1 }}
        aria-hidden="true"
      />
      {/* Avatar image */}
      <img
        src={user?.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${user?.name}`}
        alt={`${user?.name || 'User'}'s avatar`}
        className={`${s.img} rounded-full object-cover bg-slate-700`}
        style={{ padding: '2px' }}
      />
      {/* Status dot */}
      <span
        className={`absolute ${s.dot} rounded-full border-2 border-slate-900`}
        style={{ backgroundColor: ring }}
        aria-label={config.label}
      />
    </div>
  )
}
