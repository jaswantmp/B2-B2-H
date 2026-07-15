// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'b2b2h-auth'
const BASE = import.meta.env.VITE_API_BASE || ''

// ── Demo credentials ────────────────────────────────────────────────────────
const DEMO_EMAIL    = 'demo@b2b2h.com'
const DEMO_PASSWORD = 'password123'

// Intentionally does NOT spread `currentUser` from data.js so the demo user
// has a clean, clearly-labelled identity instead of inheriting a seed profile.
const DEMO_USER = {
  id: '61ace078-841c-48e7-b038-4e485a54a187',
  name: 'Jaswant MP',
  username: 'jaswantmp',
  email: DEMO_EMAIL,
  avatar: 'https://api.dicebear.com/8.x/adventurer/svg?seed=JaswantMP',
  university: 'SKCET',  
  college: 'SKCET',
  district: 'Dindigul',
  city: 'Dindigul',
  state: 'Tamil Nadu',
  year: '3rd Year',
  branch: 'Computer Science and Engineering',
  bio: 'Full-stack developer and AI enthusiast from Dindigul, Tamil Nadu. Building B2B2H to help every student builder find the right team. Passionate about hackathons, open source, and solving real problems.',
  status: 'LOOKING_FOR_TEAM',
  skills: ['React', 'Node.js', 'Python', 'Tailwind CSS', 'TypeScript'],
  verifiedSkills: ['React', 'Node.js', 'TypeScript'],
  github: 'jaswantmp',
  githubStats: { repos: 18, commits: 247, stars: 36 },
  hackathonsWon: 2,
  projects: [
    {
      name: 'B2B2H',
      desc: 'AI-powered platform for student collaboration and hackathon team formation.',
      tech: ['React', 'Vite', 'Tailwind', 'FastAPI'],
      link: '#',
    },
    {
      name: 'SmartAttend',
      desc: 'Automated attendance system using face recognition for college campuses.',
      tech: ['Python', 'OpenCV', 'FastAPI', 'React'],
      link: '#',
    },
  ],
  location: 'Dindigul, Tamil Nadu',
  interests: ['Full-Stack Development', 'AI/ML', 'Hackathons', 'Open Source'],
  domains: ['Web', 'AI/ML', 'EdTech'],
  joined: '2026-01',
  social: {},
  achievements: ['B2B2H Demo User'],
}

const delay = (ms = 700) => new Promise(r => setTimeout(r, ms))

function formatError(errData, fallback) {
  if (!errData || !errData.detail) return fallback
  if (Array.isArray(errData.detail)) {
    return errData.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
  }
  if (typeof errData.detail === 'string') {
    return errData.detail
  }
  return JSON.stringify(errData.detail)
}

function decorateUser(userObj) {
  if (!userObj) return null
  const isDemo = userObj.email === DEMO_EMAIL
  return {
    ...(isDemo ? DEMO_USER : {}),
    ...userObj,
    skills: userObj.skills || (isDemo ? DEMO_USER.skills : []),
    verifiedSkills: userObj.verifiedSkills || (isDemo ? DEMO_USER.verifiedSkills : []),
    projects: userObj.projects || (isDemo ? DEMO_USER.projects : []),
    hackathonsWon: userObj.hackathonsWon ?? (isDemo ? DEMO_USER.hackathonsWon : 0),
  }
}

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.user || !parsed?.token) return null
    return {
      token: parsed.token,
      user: decorateUser(parsed.user),
    }
  } catch {
    return null
  }
}

function persistSession(userObj, token) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token,
      user: userObj
    })
  )
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore persisted session on mount
  useEffect(() => {
    const stored = readStoredSession()
    if (stored) setUser(stored.user)
    setLoading(false)
  }, [])

  // ── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()

    if (BASE) {
      const response = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(formatError(errData, 'Login failed. Please check your credentials.'))
      }
      const data = await response.json()
      const decorated = decorateUser(data.user)
      setUser(decorated)
      persistSession(decorated, data.access_token)
      return decorated
    } else {
      await delay()
      if (normalizedEmail !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        throw new Error(
          'Invalid email or password. Use the demo credentials shown on the form.'
        )
      }

      setUser(DEMO_USER)
      persistSession(DEMO_USER, "")
      return DEMO_USER
    }
  }, [])

  // ── Sign up ─────────────────────────────────────────────────────────────
  // Builds a clean new user from the submitted form — does NOT inherit
  // any fields from the seed data or the demo user.
  const signup = useCallback(async ({ name, email, college, branch, password }) => {
    const trimmedName = name.trim()
    const rawUserObj = {
      name: trimmedName,
      username: trimmedName.toLowerCase().replace(/\s+/g, ''),
      email: email.trim().toLowerCase(),
      avatar: `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(trimmedName)}`,
      university: college.trim(),
      college: college.trim(),
      district: '',
      city: '',
      state: '',
      year: '1st Year',
      branch,
      bio: '',
      status: 'LOOKING_FOR_TEAM',
      skills: [],
      verifiedSkills: [],
      github: '',
      githubStats: { repos: 0, commits: 0, stars: 0 },
      hackathonsWon: 0,
      projects: [],
      location: college.trim(),
      interests: [],
      domains: [],
      joined: new Date().toISOString().slice(0, 7), // "YYYY-MM"
      social: {},
      achievements: [],
    }

    if (BASE) {
      const response = await fetch(`${BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rawUserObj,
          password: password || 'password123',
        }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(formatError(errData, 'Registration failed. Please check details.'))
      }
      const dbUser = await response.json()
      
      const loginResponse = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dbUser.email, password: password || 'password123' }),
      })
      if (!loginResponse.ok) {
        throw new Error('Auto-login failed after registration.')
      }
      const data = await loginResponse.json()
      const decorated = decorateUser(data.user)
      setUser(decorated)
      persistSession(decorated, data.access_token)
      return decorated
    } else {
      await delay(900)
      const newUser = {
        id: Date.now(),
        ...rawUserObj,
      }
      setUser(newUser)
      persistSession(newUser, "")
      return newUser
    }
  }, [])

  // ── Forgot password ─────────────────────────────────────────────────────
  const requestPasswordReset = useCallback(async ({ email }) => {
    await delay(900)
    return { success: true, email: email.trim().toLowerCase() }
  }, [])

  // ── Refresh User ───────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const stored = readStoredSession()
    const token = stored?.token || ''
    
    if (BASE) {
      const response = await fetch(`${BASE}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
      if (!response.ok) {
        throw new Error('Failed to refresh user profile.')
      }
      const data = await response.json()
      const decorated = decorateUser(data)
      setUser(decorated)
      persistSession(decorated, token)
      return decorated
    } else {
      // Mock mode
      const decorated = decorateUser({ ...DEMO_USER, onboarding_completed: true })
      setUser(decorated)
      persistSession(decorated, token)
      return decorated
    }
  }, [])

  // ── Logout ──────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        requestPasswordReset,
        DEMO_EMAIL,
        DEMO_PASSWORD,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
