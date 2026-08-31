// src/pages/auth/SignUpPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout.jsx'
import FormField from '../../components/auth/FormField.jsx'
import PasswordStrength, { scorePassword } from '../../components/auth/PasswordStrength.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const BRANCHES = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Data Science', 'AI & Machine Learning', 'Design + CS', 'Other',
]

export default function SignUpPage() {
  const { signup } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', college: '', branch: '',
    password: '', confirmPassword: '',
  })
  const [showPw, setShowPw]           = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [agreed, setAgreed]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [errors, setErrors]           = useState({})

  const field = (key) => ({
    value: form[key],
    onChange: e => {
      setForm(f => ({ ...f, [key]: e.target.value }))
      setErrors(er => ({ ...er, [key]: undefined }))
    },
  })

  const validate = () => {
    const er = {}
    if (!form.name.trim())    er.name = 'Full name is required.'
    if (!form.email.trim())   er.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email address.'
    if (!form.college.trim()) er.college = 'College name is required.'
    if (!form.branch)         er.branch = 'Please select your branch.'
    if (!form.password)       er.password = 'Password is required.'
    else if (scorePassword(form.password) < 2) er.password = 'Password is too weak.'
    if (form.confirmPassword !== form.password) er.confirmPassword = 'Passwords do not match.'
    if (!agreed) er.terms = 'You must accept the Terms & Conditions.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await signup(form)
      push('Account created successfully. Welcome to B2B2H!', 'success')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrors(er => ({ ...er, form: err.message || 'Sign up failed. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join B2B2H and find your next teammate."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="name"
          label="Full Name"
          value={form.name}
          onChange={field('name').onChange}
          placeholder="Your full name"
          autoComplete="name"
          error={errors.name}
          required
        />

        <FormField
          id="signup-email"
          label="Email"
          type="email"
          value={form.email}
          onChange={field('email').onChange}
          placeholder="you@college.edu"
          autoComplete="email"
          error={errors.email}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="college"
            label="College"
            value={form.college}
            onChange={field('college').onChange}
            placeholder="SRM University"
            error={errors.college}
            required
          />

          <div>
            <label htmlFor="branch" className="block text-xs font-semibold theme-muted uppercase tracking-wider mb-1.5">
              Branch <span className="text-red-400">*</span>
            </label>
            <select
              id="branch"
              value={form.branch}
              onChange={field('branch').onChange}
              className={`theme-input w-full px-3.5 py-2.5 text-sm ${errors.branch ? 'border-red-500/60' : ''}`}
            >
              <option value="">Select branch</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {errors.branch && <p className="text-xs text-red-400 mt-1.5">{errors.branch}</p>}
          </div>
        </div>

        <div>
          <FormField
            id="signup-password"
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={field('password').onChange}
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password}
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
          <PasswordStrength password={form.password} />
        </div>

        <FormField
          id="confirm-password"
          label="Confirm Password"
          type={showConfirmPw ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={field('confirmPassword').onChange}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPw(s => !s)}
              className="theme-muted hover:text-violet-400 transition-colors"
              aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
            >
              {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {/* Terms */}
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => { setAgreed(e.target.checked); setErrors(er => ({ ...er, terms: undefined })) }}
              className="w-3.5 h-3.5 rounded accent-violet-600 mt-0.5 flex-shrink-0"
            />
            <span className="text-xs theme-text-secondary leading-relaxed">
              I agree to the{' '}
              <Link to="/terms" className="text-violet-500 hover:text-violet-400">Terms & Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-violet-500 hover:text-violet-400">Privacy Policy</Link>.
            </span>
          </label>
          {errors.terms && <p className="text-xs text-red-400 mt-1.5">{errors.terms}</p>}
        </div>

        {errors.form && (
          <p role="alert" className="text-xs text-red-400 rounded-lg px-3 py-2 border border-red-800/40 bg-red-900/10">
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <UserPlus size={15} />
          }
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm theme-muted mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-violet-500 hover:text-violet-400 font-medium transition-colors">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
