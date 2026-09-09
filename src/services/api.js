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

export function normalizeBuilder(b) {
  if (!b) return b
  
  let skills = b.skills || []
  let verifiedSkills = b.verifiedSkills || []
  
  if (Array.isArray(b.user_skills)) {
    skills = b.user_skills.map(us => us.skill?.name).filter(Boolean)
    verifiedSkills = b.user_skills.filter(us => us.is_verified).map(us => us.skill?.name).filter(Boolean)
  }
  
  return {
    ...b,
    skills,
    verifiedSkills,
    projects: b.projects || [],
    teams: b.teams || [],
    hackathons: b.hackathons || [],
    social: b.social || {},
    hackathonsWon: b.hackathonsWon ?? b.hackathons_won ?? 0,
    githubStats: b.githubStats || b.github_stats || { repos: 0, commits: 0, stars: 0 },
  }
}

export function normalizeProject(p) {
  if (!p) return p
  
  let team = p.team || []
  if (Array.isArray(p.members)) {
    team = p.members.map(m => normalizeBuilder(m.user)).filter(Boolean)
  }
  if (team.length === 0 && p.creator) {
    team = [normalizeBuilder(p.creator)]
  }

  return {
    ...p,
    openRoles: p.openRoles || p.open_roles || [],
    tech: p.tech || [],
    team,
  }
}


function isNetworkError(err) {
  if (!err) return false
  if (err.name === 'AbortError') return false
  if (typeof err.status === 'number' && err.status > 0) return false
  return (
    err instanceof TypeError ||
    (typeof err.message === 'string' && (
      err.message.includes('fetch') ||
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('CONNECTION') ||
      err.message.includes('connection')
    )) ||
    err.code === 'ECONNREFUSED'
  )
}

function attachCallerSignal(promise, signal) {
  if (!signal) return promise
  if (signal.aborted) {
    const abortErr = new Error('Request aborted')
    abortErr.name = 'AbortError'
    return Promise.reject(abortErr)
  }
  return new Promise((resolve, reject) => {
    const abortHandler = () => {
      const abortErr = new Error('Request aborted')
      abortErr.name = 'AbortError'
      reject(abortErr)
    }
    signal.addEventListener('abort', abortHandler, { once: true })
    promise
      .then(res => {
        signal.removeEventListener('abort', abortHandler)
        resolve(res)
      })
      .catch(err => {
        signal.removeEventListener('abort', abortHandler)
        reject(err)
      })
  })
}

const inflightGetRequests = new Map()

// Generic fetch wrapper (used when BASE is set to a real API)
async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const isGet = method === 'GET'
  const requestKey = `${method}:${BASE}${path}`

  if (isGet && inflightGetRequests.has(requestKey)) {
    const sharedPromise = inflightGetRequests.get(requestKey)
    return attachCallerSignal(sharedPromise, options.signal)
  }

  const executeRequest = async () => {
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

    const maxRetries = options.retries ?? 3
    const retryDelayMs = options.retryDelay ?? 500

    let attempt = 0
    let res = null

    while (attempt <= maxRetries) {
      const timeoutMs = options.timeout ?? 10000
      const attemptController = new AbortController()
      const timer = setTimeout(() => attemptController.abort(), timeoutMs)

      try {
        res = await fetch(url, {
          ...options,
          headers,
          signal: attemptController.signal,
        })
        clearTimeout(timer)
        break
      } catch (err) {
        clearTimeout(timer)

        // If caller explicitly cancelled the request (e.g. unmounted), rethrow immediately
        if (options.signal?.aborted) {
          const abortErr = new Error('Request aborted')
          abortErr.name = 'AbortError'
          throw abortErr
        }

        const isStartupTimeout = err.name === 'AbortError' && attemptController.signal.aborted
        const isTransientNetwork = isNetworkError(err) || isStartupTimeout

        if (isTransientNetwork && attempt < maxRetries) {
          attempt++
          console.warn(`[API] Connection/startup failed for ${path} (${err.message}). Retrying (${attempt}/${maxRetries}) in ${retryDelayMs}ms...`)
          await new Promise(r => setTimeout(r, retryDelayMs))
          if (options.signal?.aborted) {
            const abortErr = new Error('Request aborted during retry')
            abortErr.name = 'AbortError'
            throw abortErr
          }
          continue
        }

        if (err.name === 'AbortError' || isStartupTimeout) {
          const isTimeout = !options.signal?.aborted
          const timeoutErr = new Error(isTimeout ? `Request timeout after ${timeoutMs}ms` : 'Request aborted')
          timeoutErr.name = 'AbortError'
          throw timeoutErr
        }
        throw err
      }
    }

    if (!res.ok) {
      if (res.status === 401) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('b2b2h-auth')
          }
          if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
            window.dispatchEvent(new CustomEvent('b2b2h:unauthorized'))
          }
        } catch (_) {}
      }
      let body = null
      try {
        body = await res.json()
      } catch (_) {}
      const err = new Error(`API error: ${res.status} ${res.statusText}`)
      err.status = res.status
      err.body = body
      throw err
    }
    return await res.json()
  }

  const promise = executeRequest()

  if (isGet) {
    inflightGetRequests.set(requestKey, promise)
    promise
      .finally(() => {
        if (inflightGetRequests.get(requestKey) === promise) {
          inflightGetRequests.delete(requestKey)
        }
      })
      .catch(() => {})
  }

  return attachCallerSignal(promise, options.signal)
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
  limit = null,
  signal = null,
} = {}) {
  if (BASE) {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (limit) params.append('limit', String(limit))
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
      const data = await request(`/api/v1/builders/${queryStr ? `?${queryStr}` : ''}`, { signal })
      console.log("Builders API response sample:", data ? data[0] : null)
      return (data || []).map(normalizeBuilder)
    } catch (e) {
      if (e.name === 'AbortError') {
        throw e
      }
      console.warn('Backend builders fetch failed:', e)
      throw e
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

  let resultList = result.map(({ u }) => u)
  if (limit) {
    resultList = resultList.slice(0, limit)
  }
  return resultList
}

// GET /api/v1/builders/{id}
export async function getBuilder(id) {
  if (BASE) {
    try {
      const data = await request(`/api/v1/builders/${id}`)
      return normalizeBuilder(data)
    } catch (e) {
      console.warn(`Backend builder fetch error for ${id}, returning null:`, e)
      return null
    }
  }

  await delay()
  return users.find(u => String(u.id) === String(id)) || null
}

// GET /api/v1/auth/me
export async function getMe(options = {}) {
  if (BASE) {
    const data = await request('/api/v1/auth/me', options)
    return normalizeBuilder(data)
  }

  await delay(200)
  return currentUser
}

// GET /api/v1/hackathons/
export async function getHackathons() {
  if (BASE) {
    return request('/api/v1/hackathons/')
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

// DELETE /api/v1/hackathons/{id}/register
export async function withdrawHackathon(id) {
  if (BASE) return request(`/api/v1/hackathons/${id}/register`, { method: 'DELETE' })

  await delay(600)
  return { success: true, message: 'Withdrawn successfully' }
}

// GET /api/v1/projects/
export async function getProjects(category = '') {
  if (BASE) {
    const data = await request(`/api/v1/projects/${category ? `?category=${category}` : ''}`)
    return (data || []).map(normalizeProject)
  }

  await delay()
  return category ? projects.filter(p => p.category === category) : projects
}

// GET /api/v1/teams/my
export async function getMyTeam() {
  if (BASE) {
    const team = await request('/api/v1/teams/my')
    if (team) {
      team.healthScores = team.health_scores || team.healthScores || {}
      team.missingRoles = team.missing_roles || team.missingRoles || []
      team.healthDetails = team.health_details || team.healthDetails || {}
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
  }

  await delay()
  return myTeam
}

// POST /api/v1/teams/
export async function createTeam(data) {
  if (BASE) {
    const team = await request('/api/v1/teams/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (team) {
      team.healthScores = team.health_scores || team.healthScores || {}
      team.missingRoles = team.missing_roles || team.missingRoles || []
      team.healthDetails = team.health_details || team.healthDetails || {}
      team.createdAt = team.createdAt || team.created_at || new Date().toISOString()
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
  }
  await delay()
  const newTeam = {
    id: 'mock-new-team-id',
    name: data.name,
    description: data.description,
    hackathon: 'SKCET Hackathon 2026',
    status: 'recruiting',
    members: [
      {
        id: currentUser.id,
        name: currentUser.name,
        role: 'Team Lead',
        skills: currentUser.skills || [],
        verifiedSkills: currentUser.verifiedSkills || [],
      }
    ],
    healthScores: {},
    missingRoles: [],
  }
  myTeam = newTeam
  return newTeam
}


// GET /api/v1/recommendations
export async function getRecommendations(options = {}) {
  if (BASE) {
    const [me, builders] = await Promise.all([
      getMe(options),
      getBuilders(options)
    ])
    const matchesData = await generateTeamMatches(me.id, options)
    
    const buildersMap = {}
    if (Array.isArray(builders)) {
      builders.forEach(b => {
        buildersMap[b.id] = b
      })
    }
    
    const mapped = (matchesData.matches || []).map(match => {
      const fullBuilder = buildersMap[match.id] || {
        id: match.id,
        name: match.name,
        avatar: match.avatar,
        branch: match.branch,
        university: match.university,
        status: 'LOOKING_FOR_TEAM',
        location: match.university || '',
        hackathonsWon: 0,
        skills: [],
        verifiedSkills: []
      }
      return {
        id: match.id,
        compatibility_score: match.compatibility_score,
        builder: fullBuilder,
        reason: match.reasons.join('. ') || `Recommended as a ${match.recommended_role}.`,
        fitAreas: [match.recommended_role.replace(' Developer', '').replace(' Engineer', '').replace(' Lead', '')],
        hackathon: 'HackIndia 2026'
      }
    })
    return mapped
  }

  await delay(800)
  return recommendations
}

// GET /api/v1/ai/project-recommendations
export async function getProjectRecommendations() {
  if (BASE) {
    try {
      return await request('/api/v1/ai/project-recommendations')
    } catch (e) {
      console.warn('Backend project recommendations error, returning fallback empty list:', e)
      return { total_projects: 0, recommended_count: 0, recommendations: [] }
    }
  }

  await delay(600)
  const pList = projects.map((p, idx) => {
    const normP = normalizeProject(p)
    return {
      project: normP,
      match_score: Math.max(50, 94 - (idx * 5)),
      ml_score: Math.max(50, 93.5 - (idx * 5)),
      probability_good_fit: Math.max(0.4, 0.94 - (idx * 0.05)),
      predicted_compatibility: Math.max(50, 92.0 - (idx * 4)),
      matched_skills: normP.tech.slice(0, 2),
      match_reasons: [
        `Matches required skills: ${normP.tech.slice(0, 2).join(', ')}`,
        `Aligned with ${normP.category} domain interests`,
        'High profile text similarity'
      ]
    }
  })
  return {
    total_projects: pList.length,
    recommended_count: pList.length,
    recommendations: pList
  }
}

// GET /api/v1/ai/student-cluster
export async function getStudentCluster() {
  if (BASE) {
    try {
      return await request('/api/v1/ai/student-cluster')
    } catch (e) {
      console.warn('Backend student cluster error, returning fallback cluster:', e)
      return {
        cluster_id: 0,
        segment_name: 'Applied Project Specialist',
        confidence: 0.88,
        centroid_distance: 1.34,
        dominant_skills: ['Python', 'FastAPI', 'React'],
        dominant_domains: ['AI/ML', 'Web Development'],
        explanation: 'Your profile shows strong practical project execution with technical depth across full-stack applications.'
      }
    }
  }

  await delay(400)
  return {
    cluster_id: 0,
    segment_name: 'Applied Project Specialist',
    confidence: 0.88,
    centroid_distance: 1.34,
    dominant_skills: ['Python', 'FastAPI', 'React'],
    dominant_domains: ['AI/ML', 'Web Development'],
    explanation: 'Your profile shows strong practical project execution with technical depth across full-stack applications.'
  }
}

// POST /api/v1/ai/team-generator   body: { idea: string, team_size: number, must_have_skills: string[] }
// Returns: { roles, suggestedBuilders, idea, team_quality_score, ml_score, model_version, is_ml_powered, strengths, weaknesses }
export async function generateTeam(idea, teamSize = 4, mustHaveSkills = []) {
  if (BASE) {
    try {
      const data = await request('/api/v1/ai/team-generator', {
        method: 'POST',
        body: JSON.stringify({
          idea,
          team_size: teamSize,
          must_have_skills: mustHaveSkills
        })
      })
      if (data && data.suggestedBuilders) {
        return data
      }
    } catch (e) {
      console.warn('Backend ML team generator call failed, falling back:', e)
    }
  }
  await delay(1200)
  // Non-ML Fallback
  const roles = [
    { role: 'Frontend Developer', reason: 'To build the user-facing interface and ensure great UX.', skills: ['React', 'Tailwind', 'TypeScript'] },
    { role: 'Backend Developer', reason: 'To design APIs, database schemas, and server infrastructure.', skills: ['Node.js', 'PostgreSQL', 'FastAPI'] },
    { role: 'AI / ML Engineer', reason: `To build and integrate the core AI capabilities for "${idea.slice(0, 40)}..."`, skills: ['Python', 'TensorFlow', 'LangChain'] },
    { role: 'UI/UX Designer', reason: 'To define user flows, wireframes, and a consistent design language.', skills: ['Figma', 'Prototyping', 'User Research'] },
    { role: 'Product Lead', reason: 'To own the roadmap, user interviews, and prioritization decisions.', skills: ['Product Strategy', 'Agile', 'Market Research'] },
  ]
  const suggestedBuilders = users.slice(0, teamSize || 4)
  return {
    roles: roles.slice(0, teamSize || 4),
    suggestedBuilders,
    idea,
    team_quality_score: 75,
    ml_score: 75.0,
    model_version: 'legacy_rule_baseline',
    is_ml_powered: false,
    strengths: ['Standard functional distribution'],
    weaknesses: ['Fallback mode without ML optimization']
  }
}

// POST /api/v1/teams/invite   body: { user_id, role, message }
export async function sendInvite({ userId, role, message }) {
  if (BASE) return request('/api/v1/teams/invite', {
    method: 'POST', body: JSON.stringify({ user_id: userId, role, message }),
  })

  await delay(700)
  return { success: true, message: 'Invitation sent successfully!' }
}
// GET /api/v1/teams/invites
let mockInvitations = [
  {
    id: "d3af563e-61a0-45dd-8b7b-e732b80d023f",
    team_id: "4ecb56ac-eaeb-444c-91ae-94f07fcb6f69",
    team_name: "Team Nexus",
    sender_id: "4",
    sender_name: "Karan Mehta",
    role: "Backend Developer",
    status: "pending",
    created_at: new Date().toISOString()
  },
  {
    id: "mock-invite-zara",
    team_id: "mock-team-zara",
    team_name: "BharatLLM Core Team",
    sender_id: "7",
    sender_name: "Sneha Krishnamurthy",
    role: "NLP Researcher",
    status: "pending",
    created_at: new Date().toISOString()
  }
]

export async function getMyInvitations() {
  if (BASE) return request('/api/v1/teams/invites')
  await delay()
  return mockInvitations.filter(i => i.status === 'pending')
}

export async function acceptInvitation(inviteId) {
  if (BASE) return request(`/api/v1/teams/invites/${inviteId}/accept`, { method: 'POST' })
  await delay()
  const inv = mockInvitations.find(i => i.id === inviteId)
  if (inv) inv.status = 'accepted'
  return {
    success: true,
    status: 'accepted',
    team_id: inv?.team_id || 'mock-team-1',
    team_name: inv?.team_name || 'Team Nexus'
  }
}

export async function declineInvitation(inviteId) {
  if (BASE) return request(`/api/v1/teams/invites/${inviteId}/decline`, { method: 'POST' })
  await delay()
  const inv = mockInvitations.find(i => i.id === inviteId)
  if (inv) inv.status = 'declined'
  return { success: true, status: 'declined' }
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

export async function completeOnboarding(data) {
  if (BASE) return request('/api/v1/builders/me/onboarding', { method: 'POST', body: JSON.stringify(data) })

  await delay(800)
  return { ...currentUser, ...data, onboarding_completed: true }
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

// GET /api/v1/ai/hackathon-recommendations
export async function getHackathonRecommendations() {
  if (BASE) {
    return request('/api/v1/ai/hackathon-recommendations')
  }
  await delay(800)
  return {
    total_hackathons: 3,
    recommended_count: 1,
    recommendations: [
      {
        hackathon: {
          id: 1,
          title: "Astra AI/ML Hackathon 2026",
          organizer: "Astra Technologies",
          date: "2026-08-10T09:00:00",
          end_date: "2026-08-12T18:00:00",
          location: "Bengaluru, Karnataka",
          prize: "₹2,50,000",
          team_size: "2-4",
          description: "Build next-generation agentic workflows, LLM applications, and computer vision models solving real-world challenges in workflow automation.",
          tracks: ["AI Agents", "LLMOps", "Computer Vision"],
          tags: ["AI/ML", "Generative AI", "Astra"]
        },
        score: 95,
        label: "Excellent Match",
        breakdown: {
          skills: 40,
          domains: 35,
          branch: 15,
          year: 5
        },
        matched_skills: ["Python", "FastAPI"],
        matched_domains: ["AI/ML"],
        missing_skills: ["Docker"],
        explanation: [
          "Matched Skills: Python, FastAPI",
          "Matched Interests: AI/ML",
          "Branch Alignment: Computer Science",
          "Suitable for your academic year."
        ]
      }
    ]
  }
}


// ─── Skills Management ────────────────────────────────────────────────────────
export const SUGGESTED_SKILLS = [
  // Technical
  { id: 1, name: "Python", category: "Technical" },
  { id: 2, name: "Java", category: "Technical" },
  { id: 3, name: "C++", category: "Technical" },
  { id: 4, name: "C", category: "Technical" },
  { id: 5, name: "JavaScript", category: "Technical" },
  { id: 6, name: "TypeScript", category: "Technical" },
  { id: 7, name: "React", category: "Technical" },
  { id: 8, name: "Angular", category: "Technical" },
  { id: 9, name: "Vue.js", category: "Technical" },
  { id: 10, name: "Node.js", category: "Technical" },
  { id: 11, name: "Express.js", category: "Technical" },
  { id: 12, name: "FastAPI", category: "Technical" },
  { id: 13, name: "Django", category: "Technical" },
  { id: 14, name: "Spring Boot", category: "Technical" },
  { id: 15, name: "Flutter", category: "Technical" },
  { id: 16, name: "Android", category: "Technical" },
  { id: 17, name: "iOS", category: "Technical" },
  { id: 18, name: "PostgreSQL", category: "Technical" },
  { id: 19, name: "MySQL", category: "Technical" },
  { id: 20, name: "MongoDB", category: "Technical" },
  { id: 21, name: "Firebase", category: "Technical" },
  { id: 22, name: "AWS", category: "Technical" },
  { id: 23, name: "Azure", category: "Technical" },
  { id: 24, name: "Docker", category: "Technical" },
  { id: 25, name: "Kubernetes", category: "Technical" },
  { id: 26, name: "DevOps", category: "Technical" },
  { id: 27, name: "Machine Learning", category: "Technical" },
  { id: 28, name: "Deep Learning", category: "Technical" },
  { id: 29, name: "Artificial Intelligence", category: "Technical" },
  { id: 30, name: "Generative AI", category: "Technical" },
  { id: 31, name: "Data Science", category: "Technical" },
  { id: 32, name: "Cybersecurity", category: "Technical" },
  { id: 33, name: "Blockchain", category: "Technical" },
  // Design
  { id: 34, name: "UI Design", category: "Design" },
  { id: 35, name: "UX Design", category: "Design" },
  { id: 36, name: "Figma", category: "Design" },
  { id: 37, name: "Canva", category: "Design" },
  { id: 38, name: "Graphic Design", category: "Design" },
  { id: 39, name: "Wireframing", category: "Design" },
  { id: 40, name: "Prototyping", category: "Design" },
  // Product
  { id: 41, name: "Product Management", category: "Product" },
  { id: 42, name: "Business Analysis", category: "Product" },
  { id: 43, name: "Market Research", category: "Product" },
  { id: 44, name: "Startup Strategy", category: "Product" },
  // Communication
  { id: 45, name: "Public Speaking", category: "Communication" },
  { id: 46, name: "Presentation", category: "Communication" },
  { id: 47, name: "Pitching", category: "Communication" },
  { id: 48, name: "Technical Writing", category: "Communication" },
  { id: 49, name: "Documentation", category: "Communication" },
  { id: 50, name: "Team Leadership", category: "Communication" },
  { id: 51, name: "Project Management", category: "Communication" },
  // Hackathon
  { id: 52, name: "Problem Solving", category: "Hackathon" },
  { id: 53, name: "Innovation", category: "Hackathon" },
  { id: 54, name: "Ideation", category: "Hackathon" },
  { id: 55, name: "Pitch Deck Creation", category: "Hackathon" },
  { id: 56, name: "Demo Building", category: "Hackathon" },
  { id: 57, name: "Research", category: "Hackathon" },
  { id: 58, name: "Rapid Prototyping", category: "Hackathon" }
]

let mockUserSkills = [
  { id: 101, user_id: "1", skill_id: 7, is_verified: true, proficiency: "advanced", skill: { id: 7, name: "React", category: "Technical" } },
  { id: 102, user_id: "1", skill_id: 10, is_verified: true, proficiency: "advanced", skill: { id: 10, name: "Node.js", category: "Technical" } },
  { id: 103, user_id: "1", skill_id: 12, is_verified: false, proficiency: "intermediate", skill: { id: 12, name: "FastAPI", category: "Technical" } },
  { id: 104, user_id: "1", skill_id: 1, is_verified: false, proficiency: "intermediate", skill: { id: 1, name: "Python", category: "Technical" } },
  { id: 105, user_id: "1", skill_id: 46, is_verified: false, proficiency: "intermediate", skill: { id: 46, name: "Presentation", category: "Communication" } },
  { id: 106, user_id: "1", skill_id: 36, is_verified: false, proficiency: "advanced", skill: { id: 36, name: "Figma", category: "Design" } }
]

export async function getUserSkills() {
  if (BASE) {
    try {
      return await request('/api/v1/builders/me/skills')
    } catch (e) {
      console.warn('Backend getUserSkills error, returning empty:', e)
      return []
    }
  }
  await delay()
  return mockUserSkills
}

export async function addUserSkill(data) {
  if (BASE) {
    return request('/api/v1/builders/me/skills', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  await delay()

  let targetSkill = null
  if (data.skill_id) {
    targetSkill = SUGGESTED_SKILLS.find(s => s.id === data.skill_id)
  } else if (data.skill_name) {
    const cleaned = data.skill_name.trim()
    targetSkill = SUGGESTED_SKILLS.find(s => s.name.toLowerCase() === cleaned.toLowerCase())
    if (!targetSkill) {
      // Create custom skill mock
      targetSkill = {
        id: Math.max(...SUGGESTED_SKILLS.map(s => s.id), 0) + 1,
        name: cleaned,
        category: data.category || 'Technical'
      }
      SUGGESTED_SKILLS.push(targetSkill)
    }
  }

  if (!targetSkill) {
    throw new Error('Skill details missing')
  }

  // Duplicate check
  const duplicate = mockUserSkills.find(us => us.skill_id === targetSkill.id)
  if (duplicate) {
    throw new Error(`Skill '${targetSkill.name}' is already added to your profile.`)
  }

  const newUserSkill = {
    id: Math.max(...mockUserSkills.map(s => s.id), 0) + 1,
    user_id: '1',
    skill_id: targetSkill.id,
    is_verified: false,
    proficiency: data.proficiency || 'intermediate',
    skill: targetSkill
  }
  mockUserSkills.push(newUserSkill)
  return newUserSkill
}

export async function deleteUserSkill(skillId) {
  if (BASE) {
    return request(`/api/v1/builders/me/skills/${skillId}`, {
      method: 'DELETE'
    })
  }
  await delay()
  mockUserSkills = mockUserSkills.filter(us => us.skill_id !== Number(skillId))
  return { success: true, message: 'Skill removed successfully' }
}

// ─── AI Team Matching ─────────────────────────────────────────────────────────
export async function generateTeamMatches(userId, options = {}) {
  if (BASE) {
    return request('/api/v1/ai/team-match', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
      timeout: 25000,
      ...options,
    })
  }
  await delay(1250)

  const user = users.find(u => String(u.id) === String(userId)) || currentUser
  const userSkillsSet = new Set(mockUserSkills.map(us => us.skill.name.toLowerCase()))

  const allRoles = new Set(["Frontend", "Backend", "AI/ML", "Design", "Product/Pitch"])
  const skillToRole = {
    // Frontend
    "react": "Frontend", "angular": "Frontend", "vue.js": "Frontend", "vue": "Frontend",
    "flutter": "Frontend", "android": "Frontend", "ios": "Frontend", "javascript": "Frontend",
    "typescript": "Frontend", "tailwind css": "Frontend", "tailwind": "Frontend",
    // Backend
    "node.js": "Backend", "node": "Backend", "express.js": "Backend", "express": "Backend",
    "fastapi": "Backend", "django": "Backend", "spring boot": "Backend", "spring": "Backend",
    "java": "Backend", "c++": "Backend", "c": "Backend", "python": "Backend",
    "postgresql": "Backend", "mysql": "Backend", "mongodb": "Backend", "firebase": "Backend",
    "aws": "Backend", "azure": "Backend", "docker": "Backend", "kubernetes": "Backend", "devops": "Backend",
    // AI/ML
    "machine learning": "AI/ML", "deep learning": "AI/ML", "artificial intelligence": "AI/ML",
    "generative ai": "AI/ML", "ai": "AI/ML", "data science": "AI/ML",
    // Design
    "ui design": "Design", "ux design": "Design", "ui/ux": "Design", "figma": "Design",
    "canva": "Design", "graphic design": "Design", "wireframing": "Design", "prototyping": "Design",
    // Product
    "product management": "Product/Pitch", "business analysis": "Product/Pitch", "market research": "Product/Pitch",
    "startup strategy": "Product/Pitch", "public speaking": "Product/Pitch", "presentation": "Product/Pitch",
    "pitching": "Product/Pitch", "technical writing": "Product/Pitch", "documentation": "Product/Pitch",
    "team leadership": "Product/Pitch", "project management": "Product/Pitch", "problem solving": "Product/Pitch",
    "innovation": "Product/Pitch", "ideation": "Product/Pitch", "pitch deck creation": "Product/Pitch",
    "demo building": "Product/Pitch", "research": "Product/Pitch", "rapid prototyping": "Product/Pitch"
  }

  const roleLabels = {
    "Frontend": "Frontend Developer",
    "Backend": "Backend Developer",
    "AI/ML": "AI Engineer",
    "Design": "UI/UX Designer",
    "Product/Pitch": "Product Lead"
  }

  const userRoles = new Set()
  userSkillsSet.forEach(s => { if (skillToRole[s]) userRoles.add(skillToRole[s]) })

  const candidates = users.filter(u => String(u.id) !== String(userId))
  const matches = candidates.map(c => {
    const cSkillsSet = new Set((c.skills || []).map(s => s.toLowerCase()))
    const reasons = []

    // 1. Recommended role
    const roleCounts = { "Frontend": 0, "Backend": 0, "AI/ML": 0, "Design": 0, "Product/Pitch": 0 }
    cSkillsSet.forEach(s => {
      const r = skillToRole[s]
      if (r) roleCounts[r] = (roleCounts[r] || 0) + 1
    })
    let maxRole = "Frontend"
    let maxVal = -1
    for (const [r, count] of Object.entries(roleCounts)) {
      if (count > maxVal) {
        maxVal = count
        maxRole = r
      }
    }
    const recommendedRole = maxVal > 0 ? roleLabels[maxRole] : "Full Stack Developer"

    // 2. Similarity
    let similarityScore = 0.0
    if (userSkillsSet.size > 0) {
      const shared = [...userSkillsSet].filter(s => cSkillsSet.has(s))
      similarityScore = (shared.length / userSkillsSet.size) * 100.0
      shared.slice(0, 3).forEach(s => {
        const orig = (c.skills || []).find(x => x.toLowerCase() === s) || s
        reasons.push(`Shared ${orig} skill`)
      })
    }

    // 3. Complementarity
    let complementarityScore = 0.0
    const cRoles = new Set()
    cSkillsSet.forEach(s => { if (skillToRole[s]) cRoles.add(skillToRole[s]) })
    const userLacking = new Set([...allRoles].filter(r => !userRoles.has(r)))
    if (userLacking.size > 0 && cRoles.size > 0) {
      const covered = [...userLacking].filter(r => cRoles.has(r))
      complementarityScore = (covered.length / userLacking.size) * 100.0
      covered.forEach(r => {
        reasons.push(`Complements you with ${roleLabels[r]} skills`)
      })
    }

    const skillsScore = Math.max(similarityScore, complementarityScore)

    // 4. Branch
    let branchScore = 0.0
    if (user.branch && c.branch && user.branch.toLowerCase().trim() === c.branch.toLowerCase().trim()) {
      branchScore = 100.0
      reasons.push("Same branch")
    }

    // 5. Year
    let yearScore = 0.0
    if (user.year && c.year && user.year.toLowerCase().trim() === c.year.toLowerCase().trim()) {
      yearScore = 100.0
      reasons.push("Same academic year")
    }

    // 6. University
    let uniScore = 0.0
    if (user.university && c.university && user.university.toLowerCase().trim() === c.university.toLowerCase().trim()) {
      uniScore = 100.0
      reasons.push("Same university")
    }

    // 7. Status
    let statusScore = 0.0
    if (user.status && c.status && user.status === c.status) {
      statusScore = 100.0
      reasons.push(user.status === 'LOOKING_FOR_TEAM' ? "Both looking for team" : "Same availability status")
    }

    const compatibilityScore = Math.round(
      skillsScore * 0.40 +
      branchScore * 0.25 +
      yearScore * 0.15 +
      uniScore * 0.10 +
      statusScore * 0.10
    )

    return {
      user_id: String(c.id),
      id: String(c.id),
      name: c.name,
      compatibility_score: compatibilityScore,
      reasons: reasons,
      recommended_role: recommendedRole,
      avatar: c.avatar || null,
      branch: c.branch || null,
      year: c.year || null,
      university: c.university || null
    }
  })

  // Exclude current user and filter out any with 0 score (or keep all, sorted)
  const filtered = matches.filter(m => String(m.user_id) !== String(user.id))
  filtered.sort((a, b) => b.compatibility_score - a.compatibility_score)

  return { matches: filtered.slice(0, 10) }
}

export async function applyProject(projectId) {
  if (BASE) {
    return request(`/api/v1/projects/${projectId}/apply`, { method: 'POST' })
  }
  await delay(600)
  return { success: true, message: 'Application submitted successfully' }
}

// ─── AI Quota, Limits, and Explanations ──────────────────────────────────────
export async function getAIUsage() {
  if (BASE) {
    return request('/api/v1/ai/usage')
  }
  await delay(200)
  return {
    team_matcher: { used: 3, limit: 20, remaining: 17 },
    project_generator: { used: 1, limit: 5, remaining: 4 },
    hackathon_recommender: { used: 0, limit: 20, remaining: 20 }
  }
}

export async function explainTeamMatch(targetUserId) {
  if (BASE) {
    return request('/api/v1/ai/team-match/explain', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId }),
      timeout: 25000,
    })
  }
  await delay(800)
  return {
    user_id: 'mock-current-user',
    target_user_id: targetUserId,
    ai_explanation: "This is a simulated match explanation indicating high collaboration compatibility. The candidate has complementary skills in Frontend and UI Design that balance your Backend expertise."
  }
}

/**
 * Resets the official demo account (demo@b2b2h.com) to its initial seeded state.
 * Safe failover: Returns graceful response on failure without throwing uncaught exceptions.
 */
export async function resetDemoAccount(email = 'demo@b2b2h.com') {
  console.info('[DemoReset] Reset started')
  if (BASE) {
    try {
      console.info('[DemoReset] Cleaning demo data & restoring default profile')
      const result = await request('/api/v1/demo/reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
        timeout: 5000,
      })
      console.info('[DemoReset] Reset completed')
      return result
    } catch (err) {
      console.warn('[DemoReset] Reset failed:', err)
      console.warn('[DemoReset] Using existing session because reset endpoint is unavailable')
      return { status: 'warning', message: 'Demo reset endpoint unavailable', error: err.message }
    }
  }
  await delay(200)
  console.info('[DemoReset] Reset completed (mock mode)')
  return { status: 'success', message: 'Mock demo account reset.' }
}

/**
 * Fetches database-backed administrative platform statistics.
 * Strictly protected endpoint: requires admin privileges.
 */
export async function getAdminStats() {
  if (BASE) {
    return request('/api/v1/admin/stats')
  }
  await delay(400)
  return {
    total_students: users.length,
    active_students: users.filter(u => u.status !== 'OFFLINE').length,
    verified_students: users.filter(u => u.verifiedSkills && u.verifiedSkills.length > 0).length,
    total_projects: projects.length,
    total_teams: 3,
    total_hackathons: hackathons.length,
    total_hackathon_registrations: 12,
  }
}

/**
 * List students with pagination and query filters for admin view.
 */
export async function getAdminStudents(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.is_active !== undefined && params.is_active !== '') query.set('is_active', params.is_active)
  if (params.is_verified !== undefined && params.is_verified !== '') query.set('is_verified', params.is_verified)
  if (params.college) query.set('college', params.college)
  if (params.branch) query.set('branch', params.branch)
  if (params.year) query.set('year', params.year)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)

  const queryString = query.toString() ? `?${query.toString()}` : ''

  if (BASE) {
    return request(`/api/v1/admin/students${queryString}`)
  }

  await delay(400)
  const page = parseInt(params.page || 1, 10)
  const limit = parseInt(params.limit || 20, 10)
  let filtered = [...users]

  if (params.search) {
    const s = params.search.toLowerCase()
    filtered = filtered.filter(u =>
      (u.name && u.name.toLowerCase().includes(s)) ||
      (u.username && u.username.toLowerCase().includes(s)) ||
      (u.email && u.email.toLowerCase().includes(s))
    )
  }
  if (params.status) {
    filtered = filtered.filter(u => u.status === params.status)
  }
  if (params.is_active !== undefined && params.is_active !== '') {
    const act = params.is_active === 'true' || params.is_active === true
    filtered = filtered.filter(u => (u.status !== 'OFFLINE') === act)
  }
  if (params.is_verified !== undefined && params.is_verified !== '') {
    const ver = params.is_verified === 'true' || params.is_verified === true
    filtered = filtered.filter(u => (u.verifiedSkills && u.verifiedSkills.length > 0) === ver)
  }

  const total = filtered.length
  const total_pages = Math.max(1, Math.ceil(total / limit))
  const offset = (page - 1) * limit
  const items = filtered.slice(offset, offset + limit).map(u => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    avatar: u.avatar,
    college: u.college || u.university,
    university: u.university,
    branch: u.branch,
    year: u.year,
    status: u.status,
    is_active: u.status !== 'OFFLINE',
    is_verified: !!(u.verifiedSkills && u.verifiedSkills.length > 0),
    is_admin: false,
    onboarding_completed: true,
    hackathons_won: u.hackathonsWon || 0,
    skills_count: u.skills ? u.skills.length : 0,
    joined_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))

  return { items, total, page, limit, total_pages }
}

/**
 * Get detailed profile information for a student in admin view.
 */
export async function getAdminStudent(studentId) {
  if (BASE) {
    return request(`/api/v1/admin/students/${studentId}`)
  }

  await delay(400)
  const student = users.find(u => String(u.id) === String(studentId)) || users[0]
  return {
    ...student,
    is_active: student.status !== 'OFFLINE',
    is_verified: !!(student.verifiedSkills && student.verifiedSkills.length > 0),
    is_admin: false,
    onboarding_completed: true,
    skills: (student.skills || []).map((s, idx) => ({
      id: idx + 1,
      skill_id: idx + 1,
      name: s,
      category: 'Technical',
      proficiency: 'intermediate',
      is_verified: (student.verifiedSkills || []).includes(s),
    })),
    projects: (student.projects || []).map((p, idx) => ({
      id: `p-${idx}`,
      title: p.name || p.title,
      category: 'college',
      status: 'active',
      role: 'Creator',
      is_creator: true,
      created_at: new Date().toISOString(),
    })),
    teams: (student.teams || []).map((t, idx) => ({
      id: `t-${idx}`,
      name: t.name || 'Team Hack',
      hackathon_id: 1,
      status: 'recruiting',
      role: 'Team Lead',
      is_leader: true,
      created_at: new Date().toISOString(),
    })),
    hackathons: (student.hackathons || []).map((h, idx) => ({
      id: idx + 1,
      title: h.name || 'Hackathon Event',
      organizer: 'Tech Community',
      date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      location: 'Online',
      registered_at: new Date().toISOString(),
    })),
  }
}

/**
 * Update account active status (activate/deactivate).
 */
export async function updateAdminStudentStatus(studentId, isActive) {
  if (BASE) {
    return request(`/api/v1/admin/students/${studentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    })
  }

  await delay(300)
  return { id: studentId, is_active: isActive }
}

/**
 * Update student verification status.
 */
export async function updateAdminStudentVerification(studentId, isVerified) {
  if (BASE) {
    return request(`/api/v1/admin/students/${studentId}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ is_verified: isVerified }),
    })
  }

  await delay(300)
  return { id: studentId, is_verified: isVerified }
}

/**
 * Fetch paginated list of hackathons with admin statistics (registration counts).
 */
export async function getAdminHackathons(params = {}) {
  if (BASE) {
    const qp = new URLSearchParams()
    if (params.search) qp.set('search', params.search)
    if (params.organizer) qp.set('organizer', params.organizer)
    if (params.location) qp.set('location', params.location)
    if (params.tag) qp.set('tag', params.tag)
    if (params.track) qp.set('track', params.track)
    if (params.page) qp.set('page', params.page)
    if (params.limit) qp.set('limit', params.limit)
    return request(`/api/v1/admin/hackathons?${qp.toString()}`)
  }

  await delay(400)
  let filtered = [...hackathons]
  if (params.search) {
    const s = params.search.toLowerCase()
    filtered = filtered.filter(h =>
      (h.title && h.title.toLowerCase().includes(s)) ||
      (h.organizer && h.organizer.toLowerCase().includes(s)) ||
      (h.location && h.location.toLowerCase().includes(s)) ||
      (h.description && h.description.toLowerCase().includes(s))
    )
  }
  if (params.organizer) {
    const org = params.organizer.toLowerCase()
    filtered = filtered.filter(h => h.organizer && h.organizer.toLowerCase().includes(org))
  }
  if (params.location) {
    const loc = params.location.toLowerCase()
    filtered = filtered.filter(h => h.location && h.location.toLowerCase().includes(loc))
  }
  if (params.tag) {
    filtered = filtered.filter(h => (h.tags || []).some(t => t.toLowerCase() === params.tag.toLowerCase()))
  }
  if (params.track) {
    filtered = filtered.filter(h => (h.tracks || []).some(t => t.toLowerCase() === params.track.toLowerCase()))
  }

  const page = parseInt(params.page, 10) || 1
  const limit = parseInt(params.limit, 10) || 12
  const total = filtered.length
  const total_pages = Math.max(1, Math.ceil(total / limit))
  const offset = (page - 1) * limit
  const items = filtered.slice(offset, offset + limit).map(h => ({
    ...h,
    registration_count: h.registeredCount || 0,
    created_at: h.created_at || new Date().toISOString(),
    updated_at: h.updated_at || new Date().toISOString(),
  }))

  return { items, total, page, limit, total_pages }
}

/**
 * Fetch detailed hackathon info including full registration list.
 */
export async function getAdminHackathon(hackathonId) {
  if (BASE) {
    return request(`/api/v1/admin/hackathons/${hackathonId}`)
  }

  await delay(350)
  const h = hackathons.find(item => String(item.id) === String(hackathonId)) || hackathons[0]
  return {
    ...h,
    registration_count: h.registeredCount || 0,
    created_at: h.created_at || new Date().toISOString(),
    updated_at: h.updated_at || new Date().toISOString(),
    registrations: (users || []).slice(0, 3).map((u, idx) => ({
      id: idx + 1,
      student_id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      college: u.college || u.university,
      branch: u.branch,
      year: u.year,
      registered_at: new Date().toISOString(),
    }))
  }
}

/**
 * Create a new hackathon.
 */
export async function createAdminHackathon(data) {
  if (BASE) {
    return request('/api/v1/admin/hackathons', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  await delay(500)
  const newId = Math.max(...hackathons.map(h => Number(h.id) || 0), 0) + 1
  const created = {
    id: newId,
    ...data,
    registration_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  hackathons.unshift(created)
  return created
}

/**
 * Update an existing hackathon.
 */
export async function updateAdminHackathon(hackathonId, data) {
  if (BASE) {
    return request(`/api/v1/admin/hackathons/${hackathonId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  await delay(400)
  const idx = hackathons.findIndex(h => String(h.id) === String(hackathonId))
  if (idx !== -1) {
    hackathons[idx] = { ...hackathons[idx], ...data, updated_at: new Date().toISOString() }
    return hackathons[idx]
  }
  return { id: hackathonId, ...data }
}

/**
 * Fetch registrations for a specific hackathon.
 */
export async function getAdminHackathonRegistrations(hackathonId) {
  if (BASE) {
    return request(`/api/v1/admin/hackathons/${hackathonId}/registrations`)
  }

  await delay(300)
  return (users || []).slice(0, 3).map((u, idx) => ({
    id: idx + 1,
    student_id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    college: u.college || u.university,
    branch: u.branch,
    year: u.year,
    registered_at: new Date().toISOString(),
  }))
}

/**
 * Safely delete a hackathon (fails with 409 if active registrations or teams exist).
 */
export async function deleteAdminHackathon(hackathonId) {
  if (BASE) {
    return request(`/api/v1/admin/hackathons/${hackathonId}`, {
      method: 'DELETE',
    })
  }

  await delay(400)
  const idx = hackathons.findIndex(h => String(h.id) === String(hackathonId))
  if (idx !== -1) {
    hackathons.splice(idx, 1)
  }
  return { success: true, message: 'Hackathon deleted successfully' }
}

/**
 * Fetch paginated list of projects with admin statistics (member and application counts).
 */
export async function getAdminProjects(params = {}) {
  if (BASE) {
    const qp = new URLSearchParams()
    if (params.search) qp.set('search', params.search)
    if (params.category) qp.set('category', params.category)
    if (params.status) qp.set('status', params.status)
    if (params.tech) qp.set('tech', params.tech)
    if (params.creator_id) qp.set('creator_id', params.creator_id)
    if (params.page) qp.set('page', params.page)
    if (params.limit) qp.set('limit', params.limit)
    return request(`/api/v1/admin/projects?${qp.toString()}`)
  }

  await delay(400)
  let filtered = [...projects]
  if (params.search) {
    const s = params.search.toLowerCase()
    filtered = filtered.filter(p =>
      (p.title && p.title.toLowerCase().includes(s)) ||
      (p.description && p.description.toLowerCase().includes(s)) ||
      (p.university && p.university.toLowerCase().includes(s))
    )
  }
  if (params.category) {
    filtered = filtered.filter(p => p.category && p.category.toLowerCase() === params.category.toLowerCase())
  }
  if (params.status) {
    filtered = filtered.filter(p => p.status && p.status.toLowerCase() === params.status.toLowerCase())
  }
  if (params.creator_id) {
    filtered = filtered.filter(p => p.creator_id && String(p.creator_id) === String(params.creator_id))
  }

  const page = parseInt(params.page, 10) || 1
  const limit = parseInt(params.limit, 10) || 15
  const total = filtered.length
  const total_pages = Math.max(1, Math.ceil(total / limit))
  const offset = (page - 1) * limit
  const items = filtered.slice(offset, offset + limit).map(p => ({
    ...p,
    member_count: (p.team || p.members || []).length || 1,
    application_count: 0,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
    creator: p.creator || {
      id: p.creator_id || '1',
      name: 'Project Creator',
      username: 'creator',
      email: 'creator@example.com',
      avatar: null,
      college: 'CIT Coimbatore',
      branch: 'Computer Science',
      year: '3rd Year',
      is_active: true,
      is_verified: true,
    }
  }))

  return { items, total, page, limit, total_pages }
}

/**
 * Fetch detailed project info including creator, members, and applications.
 */
export async function getAdminProject(projectId) {
  if (BASE) {
    return request(`/api/v1/admin/projects/${projectId}`)
  }

  await delay(350)
  const p = projects.find(item => String(item.id) === String(projectId)) || projects[0]
  return {
    ...p,
    member_count: (p.team || []).length || 1,
    application_count: 2,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
    creator: p.creator || {
      id: p.creator_id || '1',
      name: 'Project Creator',
      username: 'creator',
      email: 'creator@example.com',
      avatar: null,
      college: 'CIT Coimbatore',
      branch: 'Computer Science',
      year: '3rd Year',
      is_active: true,
      is_verified: true,
    },
    members: (p.team || []).map((m, idx) => ({
      id: `pm-${idx}`,
      student_id: m.id || `u-${idx}`,
      name: m.name,
      username: m.username || m.name?.toLowerCase().replace(/\s+/g, '') || `user${idx}`,
      email: m.email || `${m.name?.toLowerCase().replace(/\s+/g, '') || 'user'}@college.edu`,
      avatar: m.avatar,
      college: m.college || m.university || 'CIT Coimbatore',
      branch: m.branch || 'Information Technology',
      year: m.year || '3rd Year',
      role: m.role || 'Contributor',
      joined_at: new Date().toISOString(),
    })),
    applications: [
      {
        id: 'app-1',
        project_id: projectId,
        student_id: users[1]?.id || '2',
        name: users[1]?.name || 'Priya Sharma',
        username: users[1]?.username || 'priyasharma',
        email: users[1]?.email || 'priya@college.edu',
        avatar: users[1]?.avatar || null,
        college: users[1]?.college || 'PSG Tech',
        branch: users[1]?.branch || 'Computer Science',
        year: users[1]?.year || '2nd Year',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
  }
}

/**
 * Moderate or update an existing project.
 */
export async function updateAdminProject(projectId, data) {
  if (BASE) {
    return request(`/api/v1/admin/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  await delay(400)
  const idx = projects.findIndex(p => String(p.id) === String(projectId))
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...data, updated_at: new Date().toISOString() }
    return projects[idx]
  }
  return { id: projectId, ...data }
}

/**
 * Fetch applications for a specific project.
 */
export async function getAdminProjectApplications(projectId) {
  if (BASE) {
    return request(`/api/v1/admin/projects/${projectId}/applications`)
  }

  await delay(300)
  return [
    {
      id: 'app-1',
      project_id: projectId,
      student_id: users[1]?.id || '2',
      name: users[1]?.name || 'Priya Sharma',
      username: users[1]?.username || 'priyasharma',
      email: users[1]?.email || 'priya@college.edu',
      avatar: users[1]?.avatar || null,
      college: users[1]?.college || 'PSG Tech',
      branch: users[1]?.branch || 'Computer Science',
      year: users[1]?.year || '2nd Year',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]
}

/**
 * Safely delete a project (fails with 409 if applications or collaborator members exist).
 */
export async function deleteAdminProject(projectId) {
  if (BASE) {
    return request(`/api/v1/admin/projects/${projectId}`, {
      method: 'DELETE',
    })
  }

  await delay(400)
  const idx = projects.findIndex(p => String(p.id) === String(projectId))
  if (idx !== -1) {
    projects.splice(idx, 1)
  }
  return { success: true, message: 'Project deleted successfully' }
}

// ─── ADMIN TEAMS API ─────────────────────────────────────────────────────────

/**
 * Fetch paginated list of teams for admin management.
 */
export async function getAdminTeams({ page = 1, limit = 10, search = '', status = '', hackathon_id = null } = {}) {
  if (BASE) {
    const params = new URLSearchParams()
    params.set('page', page)
    params.set('limit', limit)
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (hackathon_id) params.set('hackathon_id', hackathon_id)

    return request(`/api/v1/admin/teams?${params.toString()}`)
  }

  await delay(300)
  return {
    items: [],
    total: 0,
    page,
    limit,
    total_pages: 1,
  }
}

/**
 * Fetch comprehensive team details for admin moderation.
 */
export async function getAdminTeam(teamId) {
  if (BASE) {
    return request(`/api/v1/admin/teams/${teamId}`)
  }

  await delay(300)
  throw new Error('Not implemented in mock mode')
}

/**
 * Moderates team details (name, description, status, max_members, hackathon_id).
 */
export async function updateAdminTeam(teamId, data) {
  if (BASE) {
    return request(`/api/v1/admin/teams/${teamId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  await delay(400)
  return { id: teamId, ...data }
}

/**
 * Fetch invitations sent by a specific team.
 */
export async function getAdminTeamInvites(teamId) {
  if (BASE) {
    return request(`/api/v1/admin/teams/${teamId}/invites`)
  }

  await delay(300)
  return []
}

/**
 * Safely delete a team (fails with 409 if invitations or collaborator members exist).
 */
export async function deleteAdminTeam(teamId) {
  if (BASE) {
    return request(`/api/v1/admin/teams/${teamId}`, {
      method: 'DELETE',
    })
  }

  await delay(400)
  return { success: true, message: 'Team deleted successfully' }
}

/**
 * Retrieve aggregated ML/AI operational usage analytics and active model metadata.
 */
export async function getAdminMLStatistics() {
  if (BASE) {
    return request('/api/v1/admin/statistics/ml')
  }

  await delay(300)
  throw new Error('Not implemented in mock mode')
}

/**
 * Request password reset email for a user.
 */
export async function requestPasswordReset(email) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (BASE) {
    return request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail }),
    })
  }

  await delay(600)
  return { message: 'If an account exists with this email, a password reset link has been sent.' }
}

/**
 * Confirm password reset with token and new password.
 */
export async function confirmPasswordReset(token, newPassword) {
  if (BASE) {
    return request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: (token || '').trim(), new_password: newPassword }),
    })
  }

  await delay(600)
  return { message: 'Password has been reset successfully. You can now log in with your new password.' }
}



