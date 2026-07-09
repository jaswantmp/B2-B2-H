// src/components/NotificationCard.jsx
import { Mail, Sparkles, Bell, Calendar, Info, Check } from 'lucide-react'
import PulseAvatar from './PulseAvatar.jsx'

const ICONS = {
  invite:    { icon: Mail,     color: 'text-violet-400',  bg: 'bg-violet-900/30 border-violet-800/40' },
  match:     { icon: Sparkles, color: 'text-cyan-400',    bg: 'bg-cyan-900/30 border-cyan-800/40' },
  update:    { icon: Check,    color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800/40' },
  hackathon: { icon: Calendar, color: 'text-amber-400',   bg: 'bg-amber-900/30 border-amber-800/40' },
  system:    { icon: Info,     color: 'text-slate-400',   bg: 'bg-slate-800/50 border-slate-700/50' },
}

export default function NotificationCard({ notification, onMarkRead }) {
  const cfg = ICONS[notification.type] || ICONS.system
  const Icon = cfg.icon

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
        notification.read
          ? 'bg-slate-800/30 border-slate-700/30 opacity-70'
          : 'bg-slate-800/60 border-slate-700/50'
      }`}
    >
      {/* Icon or Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {notification.from ? (
          <PulseAvatar user={notification.from} size="sm" showTooltip={false} />
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${cfg.bg}`}>
            <Icon size={16} className={cfg.color} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 leading-relaxed">{notification.message}</p>
        <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
      </div>

      {/* Unread dot + mark read */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        {!notification.read && (
          <>
            <span className="w-2 h-2 rounded-full bg-violet-500" aria-label="Unread" />
            <button
              onClick={() => onMarkRead?.(notification.id)}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              aria-label="Mark as read"
            >
              <Check size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
