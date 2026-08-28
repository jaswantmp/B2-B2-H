// src/components/SkillBadge.jsx

export default function SkillBadge({ skill, size = 'sm' }) {
  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold border ${sizes[size]} bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300`}
    >
      {skill}
    </span>
  )
}

