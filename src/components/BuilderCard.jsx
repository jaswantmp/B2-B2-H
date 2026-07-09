// src/components/BuilderCard.jsx
import { Link } from 'react-router-dom'
import { MapPin, Trophy, ExternalLink } from 'lucide-react'
import PulseAvatar from './PulseAvatar.jsx'
import SkillBadge from './SkillBadge.jsx'
import AvailabilityIndicator from './AvailabilityIndicator.jsx'

export default function BuilderCard({ user, onInvite }) {
  return (
    <article className="theme-card p-5 hover:border-violet-500/60 transition-all duration-200 group"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <PulseAvatar user={user} size="md" />
          <div>
            <h3 className="font-semibold theme-text group-hover:text-white text-sm leading-tight">
              {user.name}
            </h3>
            <p className="text-xs theme-muted mt-0.5">{user.branch} · {user.year}</p>
          </div>
        </div>
        <Link
          to={`/builders/${user.id}`}
          className="theme-muted hover:text-violet-400 transition-colors"
          aria-label={`View ${user.name}'s profile`}
        >
          <ExternalLink size={15} />
        </Link>
      </div>

      {/* Bio */}
      <p className="text-xs theme-muted line-clamp-2 mb-3 leading-relaxed">{user.bio}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {user.skills.slice(0, 4).map(skill => (
          <SkillBadge
            key={skill}
            skill={skill}
            verified={user.verifiedSkills?.includes(skill)}
          />
        ))}
        {user.skills.length > 4 && (
          <span className="text-xs theme-muted self-center">+{user.skills.length - 4}</span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs theme-muted mb-4">
        <span className="flex items-center gap-1">
          <MapPin size={11} aria-hidden="true" />
          {user.location}
        </span>
        <span className="flex items-center gap-1">
          <Trophy size={11} aria-hidden="true" />
          {user.hackathonsWon} wins
        </span>
      </div>

      {/* Status + Action */}
      <div
        className="flex items-center justify-between pt-3 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <AvailabilityIndicator status={user.status} />
        <button
          onClick={() => onInvite?.(user)}
          className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
          aria-label={`Invite ${user.name}`}
        >
          Invite
        </button>
      </div>
    </article>
  )
}
