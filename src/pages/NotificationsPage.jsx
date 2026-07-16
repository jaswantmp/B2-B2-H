// src/pages/NotificationsPage.jsx
import { useState, useEffect } from 'react'
import {
  Bell, Mail, Sparkles, CheckCircle, Calendar, Info,
  Check, CheckCheck, Trash2, Filter,
} from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import { getNotifications, markRead as apiMarkRead, getMyInvitations, acceptInvitation, declineInvitation } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'


const TYPE_CONFIG = {
  invite:    { icon: Mail,      color: 'text-violet-800 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30 border-violet-400 dark:border-violet-800/40', label: 'Invite'     },
  match:     { icon: Sparkles,  color: 'text-cyan-700 dark:text-cyan-400',   bg: 'bg-cyan-100 dark:bg-cyan-900/30   border-cyan-200 dark:border-cyan-800/40',   label: 'AI Match'   },
  update:    { icon: CheckCircle, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/40', label: 'Update' },
  hackathon: { icon: Calendar,  color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-900/30  border-amber-200 dark:border-amber-800/40',  label: 'Hackathon'  },
  system:    { icon: Info,      color: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-100 dark:bg-slate-800/60  border-slate-200 dark:border-slate-700/50',  label: 'System'     },
  invite_declined: { icon: Mail, color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/40', label: 'Declined' },
}

function NotifCard({ notif, linkedInvite, onRead, onDelete, onAccept, onDecline }) {
  const cfg  = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
  const Icon = cfg.icon

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
        notif.read ? 'opacity-60' : ''
      }`}
      style={{
        backgroundColor: notif.read ? 'var(--bg-surface)' : 'var(--bg-raised)',
        borderColor: notif.read ? 'var(--border-subtle)' : 'var(--border-strong)',
      }}
      role="listitem"
    >
      {/* Icon or avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {notif.from ? (
          <PulseAvatar user={notif.from} size="sm" showTooltip={false} />
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${cfg.bg}`}>
            <Icon size={16} className={cfg.color} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-semibold ${cfg.color} uppercase tracking-wide`}>
              {cfg.label}
            </span>
            <p className="text-sm theme-text leading-relaxed mt-0.5">{notif.message}</p>
            
            {/* Accept / Decline buttons if pending invite is linked */}
            {notif.type === 'invite' && linkedInvite && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => onAccept(linkedInvite.id, notif.id)}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md"
                >
                  Accept
                </button>
                <button
                  onClick={() => onDecline(linkedInvite.id, notif.id)}
                  className="px-3.5 py-1.5 border theme-divider hover:bg-[var(--bg-raised)] theme-text text-xs font-semibold rounded-lg transition-colors"
                >
                  Decline
                </button>
              </div>
            )}

            <p className="text-xs theme-muted mt-2">{notif.time}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notif.read && (
              <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mr-1" aria-label="Unread" />
            )}
            <button
              onClick={() => onRead(notif.id)}
              className="p-1.5 rounded-lg theme-muted hover:text-emerald-400 transition-colors"
              aria-label={notif.read ? 'Already read' : 'Mark as read'}
              disabled={notif.read}
            >
              <Check size={13} />
            </button>
            <button
              onClick={() => onDelete(notif.id)}
              className="p-1.5 rounded-lg theme-muted hover:text-red-400 transition-colors"
              aria-label="Delete notification"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const [notifs, setNotifs]     = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')   // 'all' | 'unread' | type keys

  const fetchData = async () => {
    if (!user?.id) return
    try {
      const [notifData, inviteData] = await Promise.all([
        getNotifications(),
        getMyInvitations()
      ])
      setNotifs(notifData)
      setInvitations(inviteData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const markRead = async id => {
    try {
      await apiMarkRead(id)
      setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllRead = async () => {
    try {
      const unread = notifs.filter(n => !n.read)
      await Promise.all(unread.map(n => apiMarkRead(n.id)))
      setNotifs(ns => ns.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleAccept = async (inviteId, notifId) => {
    try {
      await acceptInvitation(inviteId)
      push('Invitation accepted')
      if (notifId) {
        await apiMarkRead(notifId)
      }
      fetchData()
    } catch (err) {
      console.error(err)
      push('Failed to accept invitation', 'error')
    }
  }

  const handleDecline = async (inviteId, notifId) => {
    try {
      await declineInvitation(inviteId)
      push('Invitation declined')
      if (notifId) {
        await apiMarkRead(notifId)
      }
      fetchData()
    } catch (err) {
      console.error(err)
      push('Failed to decline invitation', 'error')
    }
  }

  const deleteNotif = id => setNotifs(ns => ns.filter(n => n.id !== id))
  const clearRead   = ()  => setNotifs(ns => ns.filter(n => !n.read))

  if (loading) {
    return <div className="p-4 sm:p-6 lg:p-8 max-w-3xl theme-text">Loading notifications...</div>
  }

  const unreadCount = notifs.filter(n => !n.read).length

  const FILTERS = [
    { key: 'all',    label: 'All' },
    { key: 'unread', label: 'Unread' },
    ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
  ]

  const visible = notifs.filter(n => {
    if (filter === 'all')    return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold theme-text mb-1 flex items-center gap-2">
            <Bell size={22} className="text-violet-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-violet-600 text-white rounded-full px-2 py-0.5 font-semibold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="theme-muted text-sm">{notifs.length} total · {unreadCount} unread</p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-2 rounded-lg border border-emerald-800/40 bg-emerald-900/20"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button
            onClick={clearRead}
            className="flex items-center gap-1.5 text-xs theme-muted hover:text-red-400 transition-colors px-3 py-2 rounded-lg theme-btn-ghost"
          >
            <Trash2 size={13} /> Clear read
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filter === f.key
                ? 'bg-violet-700 border-violet-500 text-white'
                : 'theme-btn-ghost'
            }`}
          >
            {f.label}
            {f.key === 'unread' && unreadCount > 0
              ? ` (${unreadCount})`
              : f.key === 'all'
                ? ` (${notifs.length})`
                : ''}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {visible.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={36} className="theme-muted mx-auto mb-3" />
          <p className="theme-text font-medium mb-1">
            {filter === 'unread' 
              ? 'All caught up!' 
              : filter === 'invite' 
                ? 'No pending invitations.' 
                : 'No notifications.'}
          </p>
          <p className="theme-muted text-sm">
            {filter === 'unread' 
              ? 'No unread notifications.' 
              : filter === 'invite'
                ? 'You do not have any pending team invitations.'
                : 'You are all caught up.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Notifications">
          {visible.map(n => (
            <NotifCard
              key={n.id}
              notif={n}
              linkedInvite={invitations.find(i => i.id === n.invite_id)}
              onRead={markRead}
              onDelete={deleteNotif}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))}
        </div>
      )}
    </div>
  )
}
