// src/components/SkillBadge.jsx
import { ShieldCheck } from 'lucide-react'

export default function SkillBadge({ skill, verified = false, size = 'sm' }) {
  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold border ${sizes[size]} ${
        verified
          ? 'bg-violet-100 dark:bg-violet-950 border-violet-400 dark:border-violet-700 text-violet-800 dark:text-violet-300'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
      }`}
    >
      {verified && <ShieldCheck size={11} className="text-violet-700 dark:text-violet-400 flex-shrink-0" aria-hidden="true" />}
      {skill}
    </span>
  )
}
