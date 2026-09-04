// src/components/TeamHealthRadar.jsx
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts'

export default function TeamHealthRadar({
  scores = {},
  height = 280,
  overallScore,
  isMlPowered = false,
  modelVersion,
  healthStatus,
  explainability = null,
}) {
  const data = Object.entries(scores).map(([area, value]) => ({
    area,
    coverage: value,
    fullMark: 100,
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800 border border-slate-700/60 dark:border-slate-600 rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="font-medium text-white dark:text-slate-200">{d.payload.area}</p>
        <p className="text-violet-400 dark:text-violet-300 font-semibold">{d.value}% covered</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      {/* ML Team Health Badge */}
      {isMlPowered && (
        <div className="mb-3 flex items-center justify-between px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700/40 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-pulse" />
            <span className="text-violet-900 dark:text-violet-200 font-semibold">
              ML Health: {overallScore ?? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(scores).length))}%
            </span>
            {healthStatus && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  healthStatus === 'Healthy'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
                    : healthStatus === 'Moderate'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50'
                    : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/50'
                }`}
              >
                {healthStatus}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
            {modelVersion || 'team_health_v1'}
          </span>
        </div>
      )}

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%" margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#94A3B8" strokeOpacity={0.3} />
          <PolarAngleAxis
            dataKey="area"
            tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Inter', fontWeight: 500 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Team Coverage"
            dataKey="coverage"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Explainable Strengths and Risks */}
      {explainability && (explainability.strengths?.length > 0 || explainability.risk_factors?.length > 0) && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 space-y-2.5 text-[11px]">
          {explainability.strengths?.length > 0 && (
            <div className="space-y-1">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                ✓ Team Strengths
              </span>
              <ul className="text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                {explainability.strengths.slice(0, 2).map((s, idx) => (
                  <li key={idx} className="leading-snug">{s}</li>
                ))}
              </ul>
            </div>
          )}
          {explainability.risk_factors?.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                ⚠ Risk Factors
              </span>
              <ul className="text-slate-700 dark:text-slate-400 space-y-1 list-disc list-inside">
                {explainability.risk_factors.slice(0, 2).map((r, idx) => (
                  <li key={idx} className="leading-snug">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
