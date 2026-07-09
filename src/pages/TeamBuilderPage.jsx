// src/pages/TeamBuilderPage.jsx
import { useState, useEffect } from 'react'
import { Hammer, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react'
import PulseAvatar from '../components/PulseAvatar.jsx'
import SkillBadge from '../components/SkillBadge.jsx'
import TeamHealthRadar from '../components/TeamHealthRadar.jsx'
import InviteModal from '../components/InviteModal.jsx'
import { getMyTeam, getBuilders } from '../services/api.js'


const GAP_SEVERITY = score => {
  if (score >= 70) return { label: 'Covered', cls: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/40' }
  if (score >= 40) return { label: 'Partial',  cls: 'text-amber-400',  bg: 'bg-amber-900/20  border-amber-800/40'  }
  return               { label: 'Missing',  cls: 'text-red-400',    bg: 'bg-red-900/20    border-red-800/40'    }
}

export default function TeamBuilderPage() {
  const [inviteUser, setInviteUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [suggested, setSuggested] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyTeam(), getBuilders()]).then(([teamData, builders]) => {
      setTeam(teamData)
      if (builders && builders.length > 16) {
        setSuggested([
          { user: builders[7],  role: 'Blockchain Dev',  fills: 'AI/ML gap'     },
          { user: builders[16], role: 'Frontend Dev',     fills: 'Frontend gap'  },
          { user: builders[14], role: 'Product Manager',  fills: 'Product gap'   },
        ])
      }
      setLoading(false)
    }).catch(console.error)
  }, [])

  if (loading || !team) {
    return <div className="p-6 lg:p-8 max-w-6xl theme-text">Loading team builder details...</div>
  }


  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Hammer size={20} className="text-violet-400" aria-hidden="true" />
          <h1 className="text-2xl font-bold theme-text">Team Builder</h1>
        </div>
        <p className="theme-muted text-sm">
          Build a balanced team with AI guidance. See your skill coverage and fill gaps before your hackathon starts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Team info */}
          <div className="theme-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-bold text-lg theme-text">{team.name}</h2>
                <p className="theme-muted text-sm">{team.hackathon}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-900/30 border border-amber-800/40 text-amber-400">
                Recruiting
              </span>
            </div>
            <p className="theme-muted text-sm leading-relaxed">{team.description}</p>
          </div>

          {/* Current members */}
          <div className="theme-card p-5">
            <h2 className="font-semibold theme-text mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              Current Members ({team.members.length})
            </h2>
            <div className="space-y-3">
              {team.members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl border theme-divider"
                  style={{ backgroundColor: 'var(--bg-raised)' }}
                >
                  <PulseAvatar user={member} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm theme-text">{member.name}</p>
                    <p className="text-xs theme-muted">{member.role}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {member.skills.slice(0, 2).map(s => (
                      <SkillBadge key={s} skill={s} verified={member.verifiedSkills?.includes(s)} size="xs" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing roles */}
          <div className="theme-card p-5">
            <h2 className="font-semibold theme-text mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              Open Roles ({team.missingRoles.length})
            </h2>

            <div className="space-y-2 mb-5">
              {team.missingRoles.map(role => (
                <div key={role} className="flex items-center justify-between p-3 rounded-xl bg-red-900/10 border border-red-800/30">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="text-sm font-medium theme-text">{role}</span>
                  </div>
                  <span className="text-xs text-red-400 font-medium">Needed</span>
                </div>
              ))}
            </div>

            {/* AI suggestions */}
            <div
              className="rounded-xl p-4 border border-violet-800/30"
              style={{ backgroundColor: 'var(--bg-raised)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-violet-400" />
                <span className="text-xs font-semibold text-violet-400">AI-suggested builders to fill your gaps</span>
              </div>
              <div className="space-y-2">
                {suggested.map(({ user, role, fills }) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border theme-divider"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    <PulseAvatar user={user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium theme-text">{user.name}</p>
                      <p className="text-xs theme-muted">{role} · <span className="text-violet-400">{fills}</span></p>
                    </div>
                    <button
                      onClick={() => setInviteUser(user)}
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Radar */}
          <div className="theme-card p-5">
            <h2 className="font-semibold theme-text mb-1">Team Health Radar</h2>
            <p className="text-xs theme-muted mb-4">Skill coverage across key areas.</p>
            <TeamHealthRadar scores={team.healthScores} height={240} />
          </div>

          {/* Coverage summary */}
          <div className="theme-card p-5">
            <h2 className="font-semibold theme-text mb-3">Coverage Summary</h2>
            <div className="space-y-2">
              {Object.entries(team.healthScores).map(([area, score]) => {
                const { label, cls, bg } = GAP_SEVERITY(score)
                return (
                  <div key={area} className={`flex items-center justify-between p-2.5 rounded-lg border ${bg}`}>
                    <span className="text-sm font-medium theme-text">{area}</span>
                    <span className={`text-xs font-semibold ${cls}`}>{label} · {score}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Overall readiness */}
          <div className="rounded-xl p-5 border border-violet-800/30 text-center" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div className="text-3xl font-bold gradient-text mb-1">56%</div>
            <p className="text-xs text-violet-400">Overall team readiness</p>
            <p className="text-xs theme-muted mt-1">Add 3 more members to reach 90%+</p>
          </div>
        </div>
      </div>


      {inviteUser && <InviteModal user={inviteUser} onClose={() => setInviteUser(null)} />}
    </div>
  )
}
