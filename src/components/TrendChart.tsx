'use client'

interface Point {
  date: string
  weight: string | null
  bodyFat: string | null
}

function numbers(points: Point[], key: 'weight' | 'bodyFat'): number[] {
  return points
    .map((p) => p[key])
    .filter((v): v is string => v != null)
    .map(Number)
}

function scaleY(values: number[], padTop: number, innerH: number) {
  const max = Math.max(...values, 0)
  const hi = max === 0 ? 1 : max * 1.08
  const span = hi || 1
  return {
    lo: 0,
    hi,
    y: (value: number) => padTop + innerH - (value / span) * innerH,
    ticks: [0, 0.25, 0.5, 0.75, 1].map((t) => span * t),
  }
}

function linePath(
  points: Point[],
  key: 'weight' | 'bodyFat',
  x: (index: number) => number,
  y: (value: number) => number,
): string {
  const segs: string[] = []
  let current: string[] = []
  points.forEach((p, i) => {
    const raw = p[key]
    if (raw == null) {
      if (current.length) {
        segs.push(`M ${current.join(' L ')}`)
        current = []
      }
      return
    }
    current.push(`${x(i)},${y(Number(raw))}`)
  })
  if (current.length) segs.push(`M ${current.join(' L ')}`)
  return segs.join(' ')
}

export default function TrendChart({
  points,
  weightLabel,
  bodyFatLabel,
}: {
  points: Point[]
  weightLabel: string
  bodyFatLabel: string
}) {
  const width = 640
  const height = 280
  const pad = { top: 28, right: 48, bottom: 36, left: 48 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const weightVals = numbers(points, 'weight')
  const bodyFatVals = numbers(points, 'bodyFat')

  if (points.length === 0 || (weightVals.length === 0 && bodyFatVals.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--color-muted)' }}>
        Log a few measurements to see the trend.
      </div>
    )
  }

  const weightScale = weightVals.length ? scaleY(weightVals, pad.top, innerH) : null
  const bodyFatScale = bodyFatVals.length ? scaleY(bodyFatVals, pad.top, innerH) : null
  const x = (index: number) =>
    pad.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW)

  const gridTicks = weightScale?.ticks ?? bodyFatScale?.ticks ?? []
  const labelEvery = Math.max(1, Math.ceil(points.length / 8))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Weight and body fat over time">
      {gridTicks.map((tick, i) => {
        const gy = pad.top + innerH * (1 - i / Math.max(gridTicks.length - 1, 1))
        return (
          <line
            key={`grid-${tick}`}
            x1={pad.left}
            x2={width - pad.right}
            y1={gy}
            y2={gy}
            stroke="var(--color-border)"
          />
        )
      })}
      {weightScale &&
        weightScale.ticks.map((tick) => (
          <text
            key={`w-${tick}`}
            x={pad.left - 8}
            y={weightScale.y(tick) + 4}
            fontSize="10"
            textAnchor="end"
            fill="var(--color-chart-weight)"
          >
            {tick.toFixed(0)}
          </text>
        ))}
      {bodyFatScale &&
        bodyFatScale.ticks.map((tick) => (
          <text
            key={`bf-${tick}`}
            x={width - pad.right + 8}
            y={bodyFatScale.y(tick) + 4}
            fontSize="10"
            textAnchor="start"
            fill="var(--color-chart-bodyfat)"
          >
            {tick.toFixed(1)}
          </text>
        ))}
      {weightScale && (
        <path
          d={linePath(points, 'weight', x, weightScale.y)}
          fill="none"
          stroke="var(--color-chart-weight)"
          strokeWidth="2.5"
        />
      )}
      {bodyFatScale && (
        <path
          d={linePath(points, 'bodyFat', x, bodyFatScale.y)}
          fill="none"
          stroke="var(--color-chart-bodyfat)"
          strokeWidth="2.5"
        />
      )}
      {points.map((p, i) => {
        const showLabel = i === 0 || i === points.length - 1 || i % labelEvery === 0
        return (
          <g key={p.date}>
            {p.weight != null && weightScale && (
              <circle cx={x(i)} cy={weightScale.y(Number(p.weight))} r="3.5" fill="var(--color-chart-weight)" />
            )}
            {p.bodyFat != null && bodyFatScale && (
              <circle cx={x(i)} cy={bodyFatScale.y(Number(p.bodyFat))} r="3.5" fill="var(--color-chart-bodyfat)" />
            )}
            {showLabel && (
              <text x={x(i)} y={height - 10} fontSize="9" textAnchor="middle" fill="var(--color-muted)">
                {p.date.slice(5)}
              </text>
            )}
          </g>
        )
      })}
      <text x={pad.left} y={16} fontSize="11" fill="var(--color-chart-weight)">{weightLabel}</text>
      <text x={width - pad.right} y={16} fontSize="11" textAnchor="end" fill="var(--color-chart-bodyfat)">
        {bodyFatLabel}
      </text>
    </svg>
  )
}
