// src/services/api.js
// ─────────────────────────────────────────────────────────────────────────────
// API Service — connect to FastAPI backend by setting VITE_API_BASE in .env
// Default falls back to mock data from data.js during development.
// ─────────────────────────────────────────────────────────────────────────────

import {
  users, hackathons, projects, recommendations,
  notifications, myTeam, currentUser,
} from './data.js'

const BASE = import.meta.env.VITE_API_BASE || ''
console.log("BASE =", BASE)

// Generic fetch wrapper (used when BASE is set to a real API)
async function request(path, options = {}) {
  const url = `${BASE}${path}`
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  try {
    const rawAuth = localStorage.getItem('b2b2h-auth')
    if (rawAuth) {
      const auth = JSON.parse(rawAuth)
      if (auth && auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`
      }
    }
  } catch (e) {
    console.error('Error reading auth token for API request:', e)
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

// ─── Mock helpers (simulate async API) ───────────────────────────────────────
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))

// ─── Users / Builders ────────────────────────────────────────────────────────
// GET /api/users
//
// searchFields checked (all case-insensitive, partial-match):
//   name, username, university, college, district, city, state, location,
//   branch, bio, skills[], verifiedSkills[], interests[], domains[],
//   achievements[], projects[].name, projects[].desc, projects[].tech[],
//   STATUSES label (e.g. "Looking For Team")
//
// filterFields (exact/array match):
//   statuses[] — user.status must be in array
//   skills[]   — user must have at least one matching skill
//   colleges[] — user.college must be in array
//   cities[]   — user.city must be in array

// Build a single lowercase search string per user for fast partial matching
function buildSearchIndex(u) {
  const safe = (v) => (v ?? '').toLowerCase()
  const safeArr = (a) => (Array.isArray(a) ? a : []).map(s => (s ?? '').toLowerCase()).join(' ')
  const projectText = (Array.isArray(u.projects) ? u.projects : [])
    .map(p => [p.name, p.desc, safeArr(p.tech)].join(' '))
    .join(' ')

  return [
    safe(u.name),
    safe(u.username),
    safe(u.university),
    safe(u.college),
    safe(u.district),
    safe(u.city),
    safe(u.state),
    safe(u.location),
    safe(u.branch),
    safe(u.bio),
    safeArr(u.skills),
    safeArr(u.verifiedSkills),
    safeArr(u.interests),
    safeArr(u.domains),
    safeArr(u.achievements),
    projectText,
    // status label so searching "looking for team" works
    safe(u.status?.replace(/_/g, ' ')),
  ].join(' ')
}

// Tokenise query into words; all tokens must hit (AND logic)
function matchesSearch(index, query) {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  return tokens.every(token => index.includes(token))
}

export async function getBuilders({
  search = '',
  skills = [],
  statuses = [],
  status = '',   // legacy single-value support
  colleges = [],
  cities = [],
} = {}) {
  if (BASE) {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (Array.isArray(skills)) {
        skills.forEach(s => params.append('skills', s))
      }
      if (Array.isArray(statuses)) {
        statuses.forEach(s => params.append('statuses', s))
      }
      if (Array.isArray(colleges)) {
        colleges.forEach(c => params.append('colleges', c))
      }
      if (Array.isArray(cities)) {
        cities.forEach(c => params.append('cities', c))
      }
      const queryStr = params.toString()
      return await request(`/api/v1/builders/${queryStr ? `?${queryStr}` : ''}`)
    } catch (e) {
      console.warn('Backend builders error, returning empty list:', e)
      return []
    }
  }

  await delay()

  // Pre-build search indices once per call
  const indexed = users.map(u => ({ u, idx: buildSearchIndex(u) }))

  let result = indexed

  // Full-text search across all fields
  if (search.trim()) {
    result = result.filter(({ idx }) => matchesSearch(idx, search))
  }

  // Availability filter — support both legacy `status` and new `statuses[]`
  const statusFilter = statuses.length ? statuses : (status ? [status] : [])
  if (statusFilter.length) {
    result = result.filter(({ u }) => statusFilter.includes(u.status))
  }

  // Skills filter — user must have at least one of the selected skills
  if (skills.length) {
    result = result.filter(({ u }) =>
      skills.some(s => (u.skills ?? []).includes(s))
    )
  }

  // College filter
  if (colleges.length) {
    result = result.filter(({ u }) =>
      colleges.some(c => (u.college ?? '').toLowerCase().includes(c.toLowerCase()))
    )
  }

  // City filter
  if (cities.length) {
    result = result.filter(({ u }) =>
      cities.some(c =>
        (u.city ?? '').toLowerCase().includes(c.toLowerCase()) ||
        (u.location ?? '').toLowerCase().includes(c.toLowerCase())
      )
    )
  }

  return result.map(({ u }) => u)
}

// GET /api/v1/builders/{id}
export async function getBuilder(id) {
  if (BASE) {
    try {
      return await request(`/api/v1/builders/${id}`)
    } catch (e) {
      console.warn(`Backend builder fetch error for ${id}, returning null:`, e)
      return null
    }
  }

  await delay()
  return users.find(u => u.id === Number(id)) || null
}

// GET /api/v1/auth/me
export async function getMe() {
  if (BASE) return request('/api/v1/auth/me')

  await delay(200)
  return currentUser
}

// GET /api/v1/hackathons/
export async function getHackathons() {
  if (BASE) {
    try {
      return await request('/api/v1/hackathons/')
    } catch (e) {
      console.warn('Backend hackathons error, returning mock hackathons:', e)
      return hackathons
    }
  }

  await delay()
  return hackathons
}

// POST /api/v1/hackathons/{id}/register
export async function registerHackathon(id) {
  if (BASE) return request(`/api/v1/hackathons/${id}/register`, { method: 'POST' })

  await delay(600)
  return { success: true, message: 'Registered successfully' }
}

// GET /api/v1/projects/
export async function getProjects(category = '') {
  if (BASE) {
    try {
      return await request(`/api/v1/projects/${category ? `?category=${category}` : ''}`)
    } catch (e) {
      console.warn('Backend projects error, returning mock projects:', e)
      return category ? projects.filter(p => p.category === category) : projects
    }
  }

  await delay()
  return category ? projects.filter(p => p.category === category) : projects
}

// GET /api/v1/teams/my
export async function getMyTeam() {
  if (BASE) {
    try {
      const team = await request('/api/v1/teams/my')
      if (team) {
        team.healthScores = team.healthScores || { Frontend: 60, Backend: 70, 'AI/ML': 40, Design: 50, Product: 60 }
        team.missingRoles = team.missingRoles || ['Blockchain / Solidity Developer', 'UI/UX Designer']
        team.createdAt = team.createdAt || team.created_at || '2026-06-20'
        team.hackathon = team.hackathon || 'SKCET Hackathon 2026'
        if (Array.isArray(team.members)) {
          team.members = team.members.map(m => {
            const u = m.user || {}
            return {
              ...u,
              role: m.role || 'Member',
              id: u.id || m.user_id,
              skills: u.skills || [],
              verifiedSkills: u.verifiedSkills || [],
            }
          })
        }
      }
      return team
    } catch (e) {
      console.warn('Backend team error, returning mock team:', e)
      return myTeam
    }
  }

  await delay()
  return myTeam
}

// GET /api/v1/recommendations
export async function getRecommendations() {
  // Always return mock recommendations to avoid 404 since backend route is not registered
  await delay(800)
  return recommendations
}

// POST /api/v1/recommend-team   body: { idea: string }
// Returns: { roles: string[], builders: User[] }
export async function generateTeam(idea) {
  if (BASE) return request('/api/v1/recommend-team', {

    method: 'POST', body: JSON.stringify({ idea }),
  })
  await delay(1500)
  // Mock AI response based on idea keywords
  const roles = [
    { role: 'Frontend Developer', reason: 'To build the user-facing interface and ensure great UX.', skills: ['React', 'Tailwind', 'TypeScript'] },
    { role: 'Backend Developer', reason: 'To design APIs, database schemas, and server infrastructure.', skills: ['Node.js', 'PostgreSQL', 'FastAPI'] },
    { role: 'AI / ML Engineer', reason: `To build and integrate the core AI capabilities for "${idea.slice(0, 40)}..."`, skills: ['Python', 'TensorFlow', 'LangChain'] },
    { role: 'UI/UX Designer', reason: 'To define user flows, wireframes, and a consistent design language.', skills: ['Figma', 'Prototyping', 'User Research'] },
    { role: 'Product Lead', reason: 'To own the roadmap, user interviews, and prioritization decisions.', skills: ['Product Strategy', 'Agile', 'Market Research'] },
  ]
  const suggestedBuilders = users.slice(0, 4)
  return { roles, suggestedBuilders, idea }
}

// POST /api/v1/teams/invite   body: { user_id, role, message }
export async function sendInvite({ userId, role, message }) {
  if (BASE) return request('/api/v1/teams/invite', {
    method: 'POST', body: JSON.stringify({ user_id: userId, role, message }),
  })

  await delay(700)
  return { success: true, message: 'Invitation sent successfully!' }
}

// GET /api/v1/notifications/
export async function getNotifications() {
  if (BASE) {
    try {
      return await request('/api/v1/notifications/')
    } catch (e) {
      console.warn('Backend notifications error, returning empty list:', e)
      return []
    }
  }

  await delay()
  return notifications
}

// PATCH /api/v1/notifications/{id}/read
export async function markRead(id) {
  if (BASE) return request(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })

  await delay(200)
  return { success: true }
}

// PATCH /api/v1/builders/me   body: Partial<User>
export async function updateProfile(data) {
  if (BASE) return request('/api/v1/builders/me', { method: 'PATCH', body: JSON.stringify(data) })

  await delay(600)
  return { success: true, user: { ...currentUser, ...data } }
}

// POST /api/v1/ai/project-idea   body: { domain, skills }
export async function generateProjectIdea(domain, skills) {
  if (BASE) return request('/api/v1/ai/project-idea', {
    method: 'POST',
    body: JSON.stringify({ domain, skills }),
  })

  await delay(1200)
  return {
    project_name: "Smart Learning Assistant",
    problem_statement: "Students struggle with personalized learning.",
    solution: "AI-powered adaptive learning assistant.",
    tech_stack: [
      "React",
      "FastAPI",
      "PostgreSQL",
      "Gemini API"
    ],
    team_roles: [
      "Frontend Developer",
      "Backend Developer",
      "AI Engineer"
    ]
  }
}

