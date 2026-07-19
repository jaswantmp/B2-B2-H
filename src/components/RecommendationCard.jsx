// src/components/RecommendationCard.jsx
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, Trophy } from 'lucide-react'
import PulseAvatar from './PulseAvatar.jsx'
import SkillBadge from './SkillBadge.jsx'
import AvailabilityIndicator from './AvailabilityIndicator.jsx'

export default function RecommendationCard({ rec, onInvite }) {
  const { builder, reason, fitAreas, hackathon } = rec

  return (
    <article className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-cyan-700/40 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <PulseAvatar user={builder} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-100 text-base leading-tight">{builder.name}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{builder.branch} · {builder.university}</p>
            </div>
            <AvailabilityIndicator status={builder.status} showLabel={false} />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {[...new Set(builder.skills)].slice(0, 3).map(skill => (
              <SkillBadge key={skill} skill={skill} verified={builder.verifiedSkills?.includes(skill)} />
            ))}
          </div>
        </div>
      </div>

      {/* AI Explanation — the core of the feature */}
      <div className="bg-slate-900/80 border border-violet-800/30 rounded-lg p-3.5 mb-4">
        <div className="flex items-center gap-1.5 text-violet-400 text-xs font-semibold mb-1.5">
          <Sparkles size={13} aria-hidden="true" />
          Why this builder fits your team
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{reason}</p>
      </div>

      {/* Fit areas */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-500">Covers:</span>
        {[...new Set(fitAreas)].map(area => (
          <span key={area} className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/50 text-cyan-400">
            {area}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1"><MapPin size={11} />{builder.location}</span>
        <span className="flex items-center gap-1"><Trophy size={11} />{builder.hackathonsWon} hackathon wins</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-slate-700/50">
        <button
          onClick={() => onInvite?.(builder)}
          className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          Send Invite
        </button>
        <Link
          to={`/builders/${builder.id}`}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
        >
          Profile
        </Link>
      </div>
    </article>
  )
}
