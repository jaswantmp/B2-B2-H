// src/components/InviteModal.jsx
import { useState } from 'react'
import { X, Send, CheckCircle } from 'lucide-react'
import PulseAvatar from './PulseAvatar.jsx'
import { sendInvite } from '../services/api.js'

const ROLES = [
  'Frontend Developer', 'Backend Developer', 'AI/ML Engineer',
  'UI/UX Designer', 'Mobile Developer', 'DevOps Engineer',
  'Product Manager', 'Full-Stack Developer',
]

export default function InviteModal({ user, onClose }) {
  const [role, setRole]       = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const handleSend = async () => {
    if (!role) return
    setLoading(true)
    try {
      await sendInvite({ userId: user.id, role, message })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-overlay backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Invite ${user.name}`}
    >
      <div
        className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <h2 className="font-semibold theme-text">Send Invitation</h2>
          <button
            onClick={onClose}
            className="theme-muted hover:text-red-400 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-900/30 border border-emerald-700/50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <h3 className="font-semibold theme-text mb-2">Invitation sent!</h3>
            <p className="text-sm theme-muted">
              {user.name} will be notified and can accept or decline your invite.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-xl theme-btn-ghost text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* User preview */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}
            >
              <PulseAvatar user={user} size="md" />
              <div>
                <p className="font-medium theme-text text-sm">{user.name}</p>
                <p className="text-xs theme-muted">{user.branch} · {user.university}</p>
              </div>
            </div>

            {/* Role select */}
            <div>
              <label htmlFor="invite-role" className="block text-xs font-medium theme-muted mb-1.5">
                Role for this person <span className="text-red-400">*</span>
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="theme-input w-full px-3 py-2.5 text-sm"
              >
                <option value="">Select a role...</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="invite-msg" className="block text-xs font-medium theme-muted mb-1.5">
                Personal message (optional)
              </label>
              <textarea
                id="invite-msg"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Hi! I'm building a project for HackIndia and think you'd be a great fit..."
                className="theme-input w-full px-3 py-2.5 text-sm resize-none"
              />
            </div>

            {/* Commitment note */}
            <p
              className="text-xs theme-muted rounded-lg p-2.5"
              style={{ backgroundColor: 'var(--bg-raised)' }}
            >
              {user.name} can see your project details and expected commitment before accepting.
            </p>

            {/* Action */}
            <button
              onClick={handleSend}
              disabled={!role || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={15} />
              }
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
