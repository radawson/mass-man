'use client'

interface Point {
  date: string
  steps: number | null
}

export const DEFAULT_STEPS_GOAL = 10000

function formatTick(value: number) {
  if (value >= 1000) {
    const thousands = value / 1000
    return Number.isInteger(thousands) ? `${thousands}k` : `${thousands.toFixed(1)}k`
  }
  return String(Math.round(value))
}

export default function StepsBarChart({
  points,
  goal = DEFAULT_STEPS_GOAL,
}: {
  points: Point[]
  goal?: number
}) {
  const days = points.filter((p) => p.steps != null && p.steps > 0)
  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--color-muted)' }}>
        Log daily steps to see this chart.
      </div>
    )
  }

  const width = 640
  const height = 280
  const pad = { top: 28, right: 16, bottom: 36, left: 48 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const goalValue = Number.isFinite(goal) && goal > 0 ? goal : DEFAULT_STEPS_GOAL
  const max = Math.max(...days.map((d) => d.steps ?? 0), goalValue, 0)
  const hi = max === 0 ? 1 : max * 1.08
  const y = (value: number) => pad.top + innerH - (value / hi) * innerH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => hi * t)
  const slot = innerW / days.length
  const barW = Math.max(2, Math.min(22, slot * 0.7))
  const labelEvery = Math.max(1, Math.ceil(days.length / 8))
  const goalY = y(goalValue)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Steps per day">
      {ticks.map((tick, i) => {
        const gy = pad.top + innerH * (1 - i / Math.max(ticks.length - 1, 1))
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
      {ticks.map((tick) => (
        <text
          key={`t-${tick}`}
          x={pad.left - 8}
          y={y(tick) + 4}
          fontSize="10"
          textAnchor="end"
          fill="var(--color-chart-steps)"
        >
          {formatTick(tick)}
        </text>
      ))}
      {days.map((day, i) => {
        const steps = day.steps ?? 0
        const x = pad.left + i * slot + (slot - barW) / 2
        const top = y(steps)
        const showLabel = i === 0 || i === days.length - 1 || i % labelEvery === 0
        return (
          <g key={day.date}>
            <rect
              x={x}
              y={top}
              width={barW}
              height={Math.max(0, pad.top + innerH - top)}
              fill="var(--color-chart-steps)"
              rx="1"
            >
              <title>{`${day.date}: ${steps.toLocaleString()} steps`}</title>
            </rect>
            {showLabel && (
              <text x={x + barW / 2} y={height - 10} fontSize="9" textAnchor="middle" fill="var(--color-muted)">
                {day.date.slice(5)}
              </text>
            )}
          </g>
        )
      })}
      <line
        x1={pad.left}
        x2={width - pad.right}
        y1={goalY}
        y2={goalY}
        stroke="var(--color-accent)"
        strokeWidth="1.75"
        strokeDasharray="6 4"
      />
      <text
        x={width - pad.right}
        y={goalY - 5}
        fontSize="10"
        textAnchor="end"
        fill="var(--color-accent)"
      >
        Goal {goalValue.toLocaleString()}
      </text>
      <text x={pad.left} y={16} fontSize="11" fill="var(--color-chart-steps)">
        Steps
      </text>
    </svg>
  )
}
