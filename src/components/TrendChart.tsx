'use client'

interface Point {
  date: string
  weight: string | null
  waist: string | null
}

export default function TrendChart({ points, weightLabel, waistLabel }: {
  points: Point[]
  weightLabel: string
  waistLabel: string
}) {
  const width = 640
  const height = 280
  const pad = { top: 20, right: 20, bottom: 36, left: 44 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const nums = points.flatMap((p) => [p.weight, p.waist].filter(Boolean).map(Number))
  if (points.length === 0 || nums.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--color-muted)' }}>
        Log a few measurements to see the trend.
      </div>
    )
  }

  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = max - min || 1
  const y = (value: number) => pad.top + innerH - ((value - min) / span) * innerH
  const x = (index: number) =>
    pad.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW)

  const pathFor = (key: 'weight' | 'waist') => {
    const coords = points
      .map((p, i) => (p[key] == null ? null : `${x(i)},${y(Number(p[key]))}`))
      .filter(Boolean)
    return coords.length ? `M ${coords.join(' L ')}` : ''
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const gy = pad.top + innerH * (1 - t)
        const label = (min + span * t).toFixed(0)
        return (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={gy} y2={gy} stroke="var(--color-border)" />
            <text x={8} y={gy + 4} fontSize="10" fill="var(--color-muted)">{label}</text>
          </g>
        )
      })}
      <path d={pathFor('weight')} fill="none" stroke="var(--color-chart-weight)" strokeWidth="2.5" />
      <path d={pathFor('waist')} fill="none" stroke="var(--color-chart-waist)" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={p.date}>
          {p.weight != null && (
            <circle cx={x(i)} cy={y(Number(p.weight))} r="3.5" fill="var(--color-chart-weight)" />
          )}
          {p.waist != null && (
            <circle cx={x(i)} cy={y(Number(p.waist))} r="3" fill="var(--color-chart-waist)" />
          )}
          <text x={x(i)} y={height - 10} fontSize="9" textAnchor="middle" fill="var(--color-muted)">
            {p.date.slice(5)}
          </text>
        </g>
      ))}
      <text x={pad.left} y={14} fontSize="11" fill="var(--color-chart-weight)">{weightLabel}</text>
      <text x={pad.left + 90} y={14} fontSize="11" fill="var(--color-chart-waist)">{waistLabel}</text>
    </svg>
  )
}
