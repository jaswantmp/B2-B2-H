// src/pages/auth/ResetPasswordPage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, ArrowLeft, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout.jsx'
import FormField from '../../components/auth/FormField.jsx'
import { confirmPasswordReset } from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { push } = useToast()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect countdown on success
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!success) return
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          navigate('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [success, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('This password reset link is invalid or missing a token.')
      return
    }
    if (!newPassword) {
      setError('Please enter your new password.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword.length > 100) {
      setError('Password must be 100 characters or fewer.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await confirmPasswordReset(token, newPassword)
      setSuccess(true)
      push('Password reset successfully! You can now log in.', 'success')
    } catch (err) {
      const detail = err?.body?.detail || err?.message
      if (err?.status === 400 || (typeof detail === 'string' && detail.toLowerCase().includes('token'))) {
        setError('This password reset link is invalid or has expired.')
      } else {
        setError(typeof detail === 'string' ? detail : 'Failed to reset password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Missing token initial state ───────────────────────────────────────────
  if (!token) {
    return (
      <AuthLayout
        title="Invalid Reset Link"
        subtitle="We couldn't find a valid reset token in this link."
      >
        <div className="text-center py-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
          >
            <AlertTriangle size={26} className="text-red-400" aria-hidden="true" />
          </div>
          <p className="text-sm theme-text-secondary leading-relaxed mb-6">
            This password reset link is invalid or has expired. Please request a new link to reset your password.
          </p>

          <Link
            to="/forgot-password"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors mb-3"
          >
            Request New Reset Link
          </Link>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl theme-btn-ghost text-sm font-medium transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout
        title="Password Reset Complete"
        subtitle=""
      >
        <div className="text-center py-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}
          >
            <CheckCircle2 size={26} className="text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold theme-text mb-2">
            Your password has been changed!
          </p>
          <p className="text-sm theme-text-secondary leading-relaxed mb-6">
            You can now log in to your B2B2H account with your new password.
          </p>
          <p className="text-xs theme-muted mb-6">
            Redirecting to login in <span className="font-semibold text-violet-400">{countdown}s</span>...
          </p>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={15} />
            Log In Now
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // ── Reset Password Form ───────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Create new password"
      subtitle="Choose a secure password with at least 8 characters."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            className="p-3.5 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
              {error.includes('expired') && (
                <Link
                  to="/forgot-password"
                  className="text-violet-400 hover:underline block mt-1 font-semibold"
                >
                  Request a new password reset link →
                </Link>
              )}
            </div>
          </div>
        )}

        <FormField
          id="new-password"
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setError('') }}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="theme-muted hover:theme-text transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <FormField
          id="confirm-password"
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setError('') }}
          placeholder="Repeat new password"
          autoComplete="new-password"
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="theme-muted hover:theme-text transition-colors p-1"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <div className="text-xs theme-muted space-y-1 py-1">
          <p className={newPassword.length >= 8 ? 'text-emerald-400' : 'theme-muted'}>
            ✓ At least 8 characters
          </p>
          <p className={newPassword && newPassword === confirmPassword ? 'text-emerald-400' : 'theme-muted'}>
            ✓ Passwords match
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <KeyRound size={15} />
          }
          {loading ? 'Updating password...' : 'Reset Password'}
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
