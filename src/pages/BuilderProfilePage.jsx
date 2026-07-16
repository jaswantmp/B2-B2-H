// src/pages/BuilderProfilePage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin, Trophy, Github, ExternalLink, ArrowLeft,
  ShieldCheck, Calendar, Star, Users, Folder,
  Linkedin, Globe,
} from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import AvailabilityIndicator from '../components/AvailabilityIndicator.jsx'
import InviteModal from '../components/InviteModal.jsx'
import { getBuilder } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const MOCK_SKILL_TO_CATEGORY = {
  python: "Technical", java: "Technical", "c++": "Technical", c: "Technical",
  javascript: "Technical", typescript: "Technical", react: "Technical", angular: "Technical",
  "vue.js": "Technical", "node.js": "Technical", "express.js": "Technical", fastapi: "Technical",
  django: "Technical", "spring boot": "Technical", flutter: "Technical", android: "Technical",
  ios: "Technical", postgresql: "Technical", mysql: "Technical", mongodb: "Technical",
  firebase: "Technical", aws: "Technical", azure: "Technical", docker: "Technical",
  kubernetes: "Technical", devops: "Technical", "machine learning": "Technical",
  "deep learning": "Technical", "artificial intelligence": "Technical", "generative ai": "Technical",
  "data science": "Technical", cybersecurity: "Technical", blockchain: "Technical",
  
  "ui design": "Design", "ux design": "Design", figma: "Design", canva: "Design",
  "graphic design": "Design", wireframing: "Design", prototyping: "Design",
  
  "product management": "Product", "business analysis": "Product", "market research": "Product",
  "startup strategy": "Product",
  
  "public speaking": "Communication", presentation: "Communication", pitching: "Communication",
  "technical writing": "Communication", documentation: "Communication", "team leadership": "Communication",
  "project management": "Communication",
  
  "problem solving": "Hackathon", innovation: "Hackathon", ideation: "Hackathon",
  "pitch deck creation": "Hackathon", "demo building": "Hackathon", research: "Hackathon",
  "rapid prototyping": "Hackathon"
}

function getGroupedSkills(builder) {
  const groups = {
    Technical: [],
    Design: [],
    Product: [],
    Communication: [],
    Hackathon: []
  }

  // 1. Try to use backend-provided user_skills relation first
  if (Array.isArray(builder.user_skills) && builder.user_skills.length > 0) {
    builder.user_skills.forEach(us => {
      const cat = us.skill?.category || 'Technical'
      const skillName = us.skill?.name
      if (skillName) {
        if (!groups[cat]) groups[cat] = []
        groups[cat].push({
          name: skillName,
          verified: us.is_verified
        })
      }
    })
  } else {
    // 2. Fallback to builder.skills
    const skills = builder.skills || []
    const verified = builder.verifiedSkills || []
    skills.forEach(name => {
      const lowerName = name.toLowerCase()
      const cat = MOCK_SKILL_TO_CATEGORY[lowerName] || 'Technical'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push({
        name: name,
        verified: verified.includes(name)
      })
    })
  }

  return groups
}

export default function BuilderProfilePage() {
  const { id } = useParams()
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    getBuilder(id).then(u => {
      console.log("Builder Profile:", u)
      setUser(u)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="p-8 animate-pulse space-y-4">
      <div className="h-32 theme-skeleton rounded-xl" />
      <div className="h-64 theme-skeleton rounded-xl" />
    </div>
  )
  if (!user) return (
    <div className="p-8 text-center theme-muted">
      Builder not found.{' '}
      <Link to="/discover" className="text-violet-400 hover:underline">Back to Discover</Link>
    </div>
  )

  const isOwnProfile = authUser && user && (String(authUser.id) === String(user.id) || authUser.username === user.username)


  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Back */}
      <Link
        to="/discover"
        className="inline-flex items-center gap-1.5 text-sm theme-muted hover:theme-text-secondary mb-6 transition-colors"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Discover
      </Link>

      {/* ── Profile header ──────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 mb-5 border theme-divider" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <PulseAvatar user={user} size="2xl" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold theme-text">{user.name}</h1>
                <p className="theme-text-secondary text-sm mt-1">{user.branch} · {user.year} · {user.university}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <AvailabilityIndicator status={user.status} />
                  <span className="theme-muted">·</span>
                  <span className="flex items-center gap-1 text-xs theme-muted">
                    <MapPin size={11} aria-hidden="true" />{user.location}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowInvite(true)}
                className="flex-shrink-0 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Send Invite
              </button>
            </div>

            <p className="text-sm theme-text mt-4 leading-relaxed">{user.bio}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t theme-divider">
              <div className="text-center">
                <div className="text-xl font-bold theme-text">{user.githubStats.repos}</div>
                <div className="text-xs theme-muted">Repos</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold theme-text">{user.githubStats.commits}</div>
                <div className="text-xs theme-muted">Commits</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold theme-text flex items-center justify-center gap-1">
                  <Trophy size={16} className="text-amber-400" aria-hidden="true" />
                  {user.hackathonsWon}
                </div>
                <div className="text-xs theme-muted">Hack Wins</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Skills, GitHub */}
        <div className="space-y-5">
          {/* Skills */}
          <div className="rounded-xl p-5 border theme-divider" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold theme-text text-sm flex items-center gap-2">
                <ShieldCheck size={15} className="text-violet-400" aria-hidden="true" />
                Skills
              </h2>
              {isOwnProfile && (
                <Link
                  to="/settings?tab=skills"
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors animate-pulse"
                >
                  Manage
                </Link>
              )}
            </div>

            <div className="space-y-4">
              {(() => {
                const grouped = getGroupedSkills(user)
                const hasAnySkills = Object.values(grouped).some(arr => arr.length > 0)

                if (!hasAnySkills) {
                  return <p className="text-xs theme-muted">No skills listed yet.</p>
                }

                return Object.entries(grouped).map(([category, items]) => {
                  if (items.length === 0) return null
                  return (
                    <div key={category} className="border-b theme-divider last:border-0 pb-3 last:pb-0">
                      <h3 className="text-[10px] font-bold theme-muted uppercase tracking-widest mb-2">
                        {category}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(item => (
                          <SkillBadge key={item.name} skill={item.name} verified={item.verified} />
                        ))}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          {/* GitHub placeholder */}
          <div className="rounded-xl p-5 border theme-divider" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h2 className="font-semibold theme-text text-sm mb-3 flex items-center gap-2">
              <Github size={15} aria-hidden="true" />
              GitHub Activity
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="theme-muted">Repositories</span>
                <span className="theme-text font-medium">{user.githubStats.repos}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="theme-muted">Total commits</span>
                <span className="theme-text font-medium">{user.githubStats.commits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="theme-muted">Stars earned</span>
                <span className="theme-text font-medium flex items-center gap-1">
                  <Star size={12} className="text-amber-400" fill="currentColor" aria-hidden="true" />
                  {user.githubStats.stars}
                </span>
              </div>
            </div>
            {user.github && (
              <a
                href={user.github.startsWith('http') ? user.github : `https://github.com/${user.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border theme-divider hover:bg-[var(--bg-raised)] text-sm theme-text transition-colors"
              >
                <Github size={14} aria-hidden="true" />
                View on GitHub
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
            {user.linkedin && (
              <a
                href={user.linkedin.startsWith('http') ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 w-full flex items-center justify-center gap-2 py-2 rounded-lg border theme-divider hover:bg-[var(--bg-raised)] text-sm theme-text transition-colors"
              >
                <Linkedin size={14} aria-hidden="true" />
                View on LinkedIn
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
            {user.website && (
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 w-full flex items-center justify-center gap-2 py-2 rounded-lg border theme-divider hover:bg-[var(--bg-raised)] text-sm theme-text transition-colors"
              >
                <Globe size={14} aria-hidden="true" />
                View Website
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
            {/* GitHub contribution chart placeholder */}
            <div className="mt-3 rounded-lg p-3 border theme-divider" style={{ backgroundColor: 'var(--bg-raised)' }}>
              <p className="text-xs theme-muted mb-2">Contribution activity (last 12 weeks)</p>
              <div className="grid grid-flow-col grid-rows-7 gap-0.5">
                {[...Array(84)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: Math.random() > 0.6
                        ? `rgba(124, 58, 237, ${0.3 + Math.random() * 0.7})`
                        : 'var(--bg-surface)',
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Projects, Hackathons */}
        <div className="lg:col-span-2 space-y-5">
          {/* Projects */}
          <div className="rounded-xl p-5 border theme-divider" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h2 className="font-semibold theme-text text-sm mb-4 flex items-center gap-2">
              <Folder size={15} className="text-cyan-400" aria-hidden="true" />
              Projects
            </h2>
            <div className="space-y-3">
              {(user.projects || []).map((proj, i) => (
                <div key={i} className="p-4 border theme-divider rounded-xl hover:border-violet-500/50 transition-all" style={{ backgroundColor: 'var(--bg-raised)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold theme-text text-sm">{proj.name}</h3>
                    <a
                      href={proj.link}
                      className="theme-muted hover:text-violet-400 transition-colors flex-shrink-0"
                      aria-label={`View ${proj.name}`}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <p className="text-xs theme-text-secondary mb-3 leading-relaxed">{proj.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(proj.tech || []).map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-[var(--bg-surface)] border theme-divider rounded theme-text-secondary">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hackathon history placeholder */}
          <div className="rounded-xl p-5 border theme-divider" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h2 className="font-semibold theme-text text-sm mb-4 flex items-center gap-2">
              <Trophy size={15} className="text-amber-400" aria-hidden="true" />
              Hackathon History
            </h2>
            <div className="space-y-2">
              {[
                { name: 'Smart India Hackathon 2025', result: 'Top 10', date: '2025-09' },
                { name: 'HackNITR 2025', result: '1st Place 🏆', date: '2025-03' },
                { name: 'MLH Global Hack 2024', result: 'Participated', date: '2024-09' },
              ].map(h => (
                <div key={h.name} className="flex items-center justify-between p-3 rounded-lg border theme-divider" style={{ backgroundColor: 'var(--bg-raised)' }}>
                  <div>
                    <p className="text-sm theme-text">{h.name}</p>
                    <p className="text-xs theme-muted">{h.date}</p>
                  </div>
                  <span className={`text-xs font-medium ${h.result.includes('1st') ? 'text-amber-400' : h.result === 'Participated' ? 'theme-muted' : 'text-emerald-400'}`}>
                    {h.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showInvite && <InviteModal user={user} onClose={() => setShowInvite(false)} />}
    </div>
  )
}
