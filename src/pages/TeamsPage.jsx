// src/pages/TeamsPage.jsx
import { useState, useEffect } from 'react'
import {
  UsersRound, AlertTriangle, CheckCircle, Clock, Sparkles,
  UserPlus, Shield, TrendingUp,
} from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import TeamHealthRadar from '../components/TeamHealthRadar.jsx'
import InviteModal from '../components/InviteModal.jsx'
import { getMyTeam, getBuilders } from '../services/api.js'


const COVER_SEVERITY = score => {
  if (score >= 70) return { label: 'Covered', cls: 'text-emerald-400', bar: '#10B981', pill: 'bg-emerald-900/30 border-emerald-800/40' }
  if (score >= 40) return { label: 'Partial',  cls: 'text-amber-400',  bar: '#F59E0B', pill: 'bg-amber-900/30  border-amber-800/40'  }
  return               { label: 'Missing',  cls: 'text-red-400',    bar: '#EF4444', pill: 'bg-red-900/30    border-red-800/40'    }
}

export default function TeamsPage() {
  const [inviteUser, setInviteUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [suggested, setSuggested] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyTeam(), getBuilders()]).then(([teamData, builders]) => {
      setTeam(teamData)
      if (builders && builders.length > 16) {
        setSuggested([
          { user: builders[7],  role: 'Blockchain / Solidity Developer' },
          { user: builders[16], role: 'Frontend React Developer' },
          { user: builders[14], role: 'Product Manager' },
        ])
      }
      setLoading(false)
    }).catch(console.error)
  }, [])

  if (loading || !team) {
    return <div className="p-6 lg:p-8 max-w-6xl theme-text">Loading team details...</div>
  }

  const overallScore = Math.round(
    Object.values(team.healthScores).reduce((a, b) => a + b, 0) /
    Object.values(team.healthScores).length
  )


  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold theme-text mb-1 flex items-center gap-2">
          <UsersRound size={22} className="text-violet-400" />
          My Teams
        </h1>
        <p className="theme-muted text-sm">Manage your active teams, track skill coverage, and invite collaborators.</p>
      </div>

      {/* Team overview card */}
      <div
        className="rounded-2xl p-6 border mb-6"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-xl font-bold theme-text">{team.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-900/30 border border-amber-800/40 text-amber-400 capitalize">
                {team.status}
              </span>
            </div>
            <p className="theme-muted text-sm">
              {team.hackathon} · Created {new Date(team.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          {/* Overall score badge */}
          <div className="flex-shrink-0 text-center px-5 py-3 rounded-xl border border-violet-800/40 bg-violet-900/20">
            <div className="text-2xl font-bold gradient-text">{overallScore}%</div>
            <div className="text-xs text-violet-400">Team readiness</div>
          </div>
        </div>
        <p className="theme-muted text-sm leading-relaxed">{team.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Members + Missing roles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members */}
          <section>
            <h2 className="font-semibold theme-text mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
              <CheckCircle size={15} className="text-emerald-400" />
              Members ({team.members.length} / {team.members.length + team.missingRoles.length})
            </h2>
            <div className="space-y-3">
              {team.members.map(m => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 p-4 rounded-xl border theme-divider"
                  style={{ backgroundColor: 'var(--bg-raised)' }}
                >
                  <PulseAvatar user={m} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm theme-text">{m.name}</p>
                    <p className="text-xs theme-muted">{m.role}</p>
                    <p className="text-xs theme-muted mt-0.5">{m.university} · {m.year}</p>
                  </div>
                  <div className="hidden sm:flex flex-wrap gap-1 justify-end">
                    {m.skills.slice(0, 2).map(s => (
                      <SkillBadge key={s} skill={s} verified={m.verifiedSkills?.includes(s)} size="xs" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Missing roles */}
          <section>
            <h2 className="font-semibold theme-text mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
              <AlertTriangle size={15} className="text-amber-400" />
              Open Roles ({team.missingRoles.length})
            </h2>
            <div className="space-y-2 mb-5">
              {team.missingRoles.map(role => (
                <div
                  key={role}
                  className="flex items-center justify-between p-3.5 rounded-xl border bg-red-900/10 border-red-800/30"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="text-sm font-medium theme-text">{role}</span>
                  </div>
                  <span className="text-xs text-red-400 font-medium">Unfilled</span>
                </div>
              ))}
            </div>

            {/* Suggested builders for open roles */}
            <div
              className="rounded-xl p-4 border border-violet-800/30"
              style={{ backgroundColor: 'var(--bg-raised)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-violet-400" />
                <span className="text-xs font-semibold text-violet-400">Suggested builders</span>
              </div>
              <div className="space-y-2.5">
                {suggested.map(({ user, role }) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border theme-divider"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    <PulseAvatar user={user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium theme-text">{user.name}</p>
                      <p className="text-xs theme-muted">Matches: {role}</p>
                    </div>
                    <button
                      onClick={() => setInviteUser(user)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                    >
                      <UserPlus size={12} /> Invite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right: Radar + coverage */}
        <div className="space-y-5">
          {/* Radar */}
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <h2 className="font-semibold theme-text text-sm mb-1 flex items-center gap-2">
              <TrendingUp size={15} className="text-violet-400" />
              Team Health Radar
            </h2>
            <p className="text-xs theme-muted mb-4">Current skill coverage across domains.</p>
            <TeamHealthRadar scores={team.healthScores} height={220} />
          </div>

          {/* Coverage bars */}
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <h2 className="font-semibold theme-text text-sm mb-4 flex items-center gap-2">
              <Shield size={15} className="text-cyan-400" />
              Skill Coverage
            </h2>
            <div className="space-y-3">
              {Object.entries(team.healthScores).map(([area, score]) => {
                const { label, cls, bar, pill } = COVER_SEVERITY(score)
                return (
                  <div key={area}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium theme-text">{area}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${pill}`}>
                        {label}
                      </span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-raised)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, backgroundColor: bar }}
                      />
                    </div>
                    <p className={`text-xs ${cls} mt-0.5 text-right`}>{score}%</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Progress card */}
          <div
            className="rounded-2xl p-5 border border-violet-800/40"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-amber-400" />
              <h2 className="font-semibold theme-text text-sm">Timeline</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="theme-muted">Hackathon</span>
                <span className="theme-text font-medium">{team.hackathon}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-muted">Status</span>
                <span className="text-amber-400 font-medium capitalize">{team.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-muted">Team size</span>
                <span className="theme-text font-medium">
                  {team.members.length} / {team.members.length + team.missingRoles.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="theme-muted">Readiness</span>
                <span className="gradient-text font-bold">{overallScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {inviteUser && <InviteModal user={inviteUser} onClose={() => setInviteUser(null)} />}
    </div>
  )
}
