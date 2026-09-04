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
      <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="font-medium text-slate-200">{d.payload.area}</p>
        <p className="text-violet-400">{d.value}% covered</p>
      </div>
    )
  }

  const getColor = (value) => {
    if (value >= 70) return '#10B981'
    if (value >= 40) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="w-full">
      {/* ML Team Health Badge */}
      {isMlPowered && (
        <div className="mb-3 flex items-center justify-between px-3 py-2 rounded-xl bg-violet-950/30 border border-violet-700/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-200 font-semibold">
              ML Health: {overallScore ?? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(scores).length))}%
            </span>
            {healthStatus && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  healthStatus === 'Healthy'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                    : healthStatus === 'Moderate'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                    : 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                }`}
              >
                {healthStatus}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{modelVersion || 'team_health_v1'}</span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%" margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="area"
            tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'Inter' }}
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

      {/* Legend with gap indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
        {data.map(({ area, coverage }) => (
          <div key={area} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1.5 border-b border-slate-800/40 pb-2.5 last:border-0 sm:border-0 sm:pb-0">
            <span className="text-slate-400 font-semibold sm:font-normal">{area}</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
              <div className="w-full sm:w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${coverage}%`, backgroundColor: getColor(coverage) }}
                />
              </div>
              <span className="text-slate-400 text-left sm:text-right sm:w-8 font-semibold sm:font-normal">{coverage}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Explainable Strengths and Risks */}
      {explainability && (explainability.strengths?.length > 0 || explainability.risk_factors?.length > 0) && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2 text-[11px]">
          {explainability.strengths?.length > 0 && (
            <div className="space-y-1">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                ✓ Team Strengths
              </span>
              <ul className="text-slate-300 space-y-0.5 list-disc list-inside">
                {explainability.strengths.slice(0, 2).map((s, idx) => (
                  <li key={idx} className="truncate">{s}</li>
                ))}
              </ul>
            </div>
          )}
          {explainability.risk_factors?.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                ⚠ Risk Factors
              </span>
              <ul className="text-slate-400 space-y-0.5 list-disc list-inside">
                {explainability.risk_factors.slice(0, 2).map((r, idx) => (
                  <li key={idx} className="truncate">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
