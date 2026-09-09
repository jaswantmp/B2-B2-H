// src/pages/auth/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Zap, Info } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout.jsx'
import FormField from '../../components/auth/FormField.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

export default function LoginPage() {
  const { login, DEMO_EMAIL, DEMO_PASSWORD } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading]   = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError]       = useState('')

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  // ── Normal login ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    try {
      await login({ email, password, remember })
      push('Login successful. Welcome back!', 'success')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── One-click demo login — logs in directly, no form fill needed ──────
  const handleDemoLogin = async () => {
    setError('')
    setDemoLoading(true)
    try {
      await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
      push('Welcome to the B2B2H demo! Explore all features.', 'success')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setDemoLoading(false)
    }
  }

  const anyLoading = loading || demoLoading

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue finding your team."
    >
      {/* ── Demo / Seeded Data Disclosure Notice ── */}
      <div
        className="mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all"
        style={{
          backgroundColor: 'rgba(139, 92, 246, 0.05)',
          borderColor: 'rgba(139, 92, 246, 0.25)',
        }}
      >
        <Info size={16} className="text-violet-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="leading-relaxed" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
          <span className="font-semibold text-violet-300 block mb-0.5">Demo Environment Notice: </span>
          This application is a functional prototype using seeded sample data for demonstration purposes. Student profiles, projects, teams, hackathons, registrations, and activity shown in the demo are not real-world users or events.
        </div>
      </div>

      {/* ── Single Refined Demo Login Card ── */}
      <div className="mb-5">
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={anyLoading}
          className="w-full text-left p-4 rounded-xl border transition-all disabled:opacity-60 disabled:cursor-not-allowed group space-y-2.5"
          style={{
            backgroundColor: 'var(--bg-raised)',
            borderColor: 'rgba(139,92,246,0.4)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.8)'; e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.backgroundColor = 'var(--bg-raised)' }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-700/30 border border-violet-600/50 flex items-center justify-center flex-shrink-0">
                {demoLoading
                  ? <span className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                  : <Zap size={16} className="text-violet-400" aria-hidden="true" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Continue as Demo
                </p>
                <p className="text-xs text-violet-400 font-medium">
                  Explore the complete platform instantly.
                </p>
              </div>
            </div>
            <span className="text-violet-400 text-xs font-medium flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </div>

          {/* Subtext */}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Changes reset automatically after logout.
          </p>

          {/* Credentials badge */}
          <div
            className="flex items-center justify-between text-xs font-mono px-3 py-1.5 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <span className="text-violet-300 font-medium">demo@b2b2h.com</span>
            <span className="theme-muted">·</span>
            <span className="text-violet-300 font-medium">password123</span>
          </div>
        </button>

        {/* Divider between demo and form */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            or log in with your account
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
        </div>
      </div>

      {/* ── Email / password form ── */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="you@college.edu"
          autoComplete="email"
          required
        />

        <FormField
          id="password"
          label="Password"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              className="theme-muted hover:text-violet-400 transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {error && (
          <p
            role="alert"
            className="text-xs rounded-lg px-3 py-2 border"
            style={{
              color: '#f87171',
              borderColor: 'rgba(239,68,68,0.3)',
              backgroundColor: 'rgba(239,68,68,0.08)',
            }}
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-violet-600"
            />
            <span className="text-xs theme-text-secondary">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-violet-500 hover:text-violet-400 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={anyLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <LogIn size={15} />
          }
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-center text-sm theme-muted mt-6">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="text-violet-500 hover:text-violet-400 font-medium transition-colors"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
