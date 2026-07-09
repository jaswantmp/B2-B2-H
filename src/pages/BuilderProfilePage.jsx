// src/pages/BuilderProfilePage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin, Trophy, Github, ExternalLink, ArrowLeft,
  ShieldCheck, Calendar, Star, Users, Folder,
} from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import AvailabilityIndicator from '../components/AvailabilityIndicator.jsx'
import InviteModal from '../components/InviteModal.jsx'
import { getBuilder } from '../services/api.js'

export default function BuilderProfilePage() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    getBuilder(id).then(u => { setUser(u); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="p-8 animate-pulse space-y-4">
      <div className="h-32 bg-slate-800 rounded-xl" />
      <div className="h-64 bg-slate-800 rounded-xl" />
    </div>
  )
  if (!user) return (
    <div className="p-8 text-center text-slate-500">
      Builder not found.{' '}
      <Link to="/discover" className="text-violet-400 hover:underline">Back to Discover</Link>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Back */}
      <Link
        to="/discover"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Discover
      </Link>

      {/* ── Profile header ──────────────────────────────────────────── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <PulseAvatar user={user} size="2xl" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <p className="text-slate-400 text-sm mt-1">{user.branch} · {user.year} · {user.university}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <AvailabilityIndicator status={user.status} />
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
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

            <p className="text-sm text-slate-300 mt-4 leading-relaxed">{user.bio}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-700/50">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{user.githubStats.repos}</div>
                <div className="text-xs text-slate-500">Repos</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{user.githubStats.commits}</div>
                <div className="text-xs text-slate-500">Commits</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white flex items-center justify-center gap-1">
                  <Trophy size={16} className="text-amber-400" aria-hidden="true" />
                  {user.hackathonsWon}
                </div>
                <div className="text-xs text-slate-500">Hack Wins</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Skills, GitHub */}
        <div className="space-y-5">
          {/* Skills */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h2 className="font-semibold text-slate-200 text-sm mb-3 flex items-center gap-2">
              <ShieldCheck size={15} className="text-violet-400" aria-hidden="true" />
              Skills
            </h2>
            <div className="mb-1">
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <ShieldCheck size={11} className="text-violet-400" /> GitHub-verified
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {user.verifiedSkills.map(s => (
                  <SkillBadge key={s} skill={s} verified />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Self-reported</p>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.filter(s => !user.verifiedSkills.includes(s)).map(s => (
                  <SkillBadge key={s} skill={s} />
                ))}
              </div>
            </div>
          </div>

          {/* GitHub placeholder */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h2 className="font-semibold text-slate-200 text-sm mb-3 flex items-center gap-2">
              <Github size={15} aria-hidden="true" />
              GitHub Activity
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Repositories</span>
                <span className="text-slate-200 font-medium">{user.githubStats.repos}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total commits</span>
                <span className="text-slate-200 font-medium">{user.githubStats.commits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Stars earned</span>
                <span className="text-slate-200 font-medium flex items-center gap-1">
                  <Star size={12} className="text-amber-400" fill="currentColor" aria-hidden="true" />
                  {user.githubStats.stars}
                </span>
              </div>
            </div>
            <a
              href={`https://github.com/${user.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-600 hover:bg-slate-700 text-sm text-slate-300 transition-colors"
            >
              <Github size={14} aria-hidden="true" />
              View on GitHub
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            {/* GitHub contribution chart placeholder */}
            <div className="mt-3 bg-slate-900/60 rounded-lg p-3 border border-slate-700/40">
              <p className="text-xs text-slate-500 mb-2">Contribution activity (last 12 weeks)</p>
              <div className="grid grid-flow-col grid-rows-7 gap-0.5">
                {[...Array(84)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: Math.random() > 0.6
                        ? `rgba(124, 58, 237, ${0.3 + Math.random() * 0.7})`
                        : '#1E293B',
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
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h2 className="font-semibold text-slate-200 text-sm mb-4 flex items-center gap-2">
              <Folder size={15} className="text-cyan-400" aria-hidden="true" />
              Projects
            </h2>
            <div className="space-y-3">
              {user.projects.map((proj, i) => (
                <div key={i} className="p-4 bg-slate-900/50 border border-slate-700/40 rounded-xl hover:border-slate-600 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-200 text-sm">{proj.name}</h3>
                    <a
                      href={proj.link}
                      className="text-slate-500 hover:text-violet-400 transition-colors flex-shrink-0"
                      aria-label={`View ${proj.name}`}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">{proj.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.tech.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hackathon history placeholder */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h2 className="font-semibold text-slate-200 text-sm mb-4 flex items-center gap-2">
              <Trophy size={15} className="text-amber-400" aria-hidden="true" />
              Hackathon History
            </h2>
            <div className="space-y-2">
              {[
                { name: 'Smart India Hackathon 2025', result: 'Top 10', date: '2025-09' },
                { name: 'HackNITR 2025', result: '1st Place 🏆', date: '2025-03' },
                { name: 'MLH Global Hack 2024', result: 'Participated', date: '2024-09' },
              ].map(h => (
                <div key={h.name} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-700/30">
                  <div>
                    <p className="text-sm text-slate-200">{h.name}</p>
                    <p className="text-xs text-slate-500">{h.date}</p>
                  </div>
                  <span className={`text-xs font-medium ${h.result.includes('1st') ? 'text-amber-400' : h.result === 'Participated' ? 'text-slate-500' : 'text-emerald-400'}`}>
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
