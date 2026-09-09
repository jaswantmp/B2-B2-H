// src/pages/auth/ForgotPasswordPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Send, ArrowLeft, MailCheck } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout.jsx'
import FormField from '../../components/auth/FormField.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email address.'); return }

    setLoading(true)
    try {
      await requestPasswordReset({ email })
      setSent(true)
      push('If an account exists with this email, a password reset link has been sent.', 'success')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <div className="text-center py-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}
          >
            <MailCheck size={26} className="text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-sm theme-text-secondary leading-relaxed mb-1">
            If an account exists with this email, we've sent a password reset link to
          </p>
          <p className="text-sm font-semibold theme-text mb-6">{email}</p>
          <p className="text-xs theme-muted leading-relaxed mb-6">
            Didn't get the email? Check your spam folder, or try again with a different address.
          </p>

          <button
            onClick={() => setSent(false)}
            className="w-full py-2.5 rounded-xl theme-btn-ghost text-sm font-medium transition-colors mb-3"
          >
            Try a different email
          </button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="reset-email"
          label="Email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="you@college.edu"
          autoComplete="email"
          error={error}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Send size={15} />
          }
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl theme-btn-ghost text-sm font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Login
        </button>
      </form>
    </AuthLayout>
  )
}
