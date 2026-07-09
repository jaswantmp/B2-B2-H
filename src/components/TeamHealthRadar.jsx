// src/components/TeamHealthRadar.jsx
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts'

export default function TeamHealthRadar({ scores = {}, height = 280 }) {
  const data = Object.entries(scores).map(([area, value]) => ({
    area,
    coverage: value,
    fullMark: 100,
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm">
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
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="area"
            tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'Inter' }}
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
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map(({ area, coverage }) => (
          <div key={area} className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{area}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${coverage}%`, backgroundColor: getColor(coverage) }}
                />
              </div>
              <span className="text-slate-400 w-8 text-right">{coverage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
