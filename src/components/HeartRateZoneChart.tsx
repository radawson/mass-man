'use client'

import Link from 'next/link'
import { heartRateZones, maxHeartRate, zoneBoundsAtAge } from '@/lib/heart-rate'

const zoneColor: Record<string, string> = {
  fat: 'var(--color-zone-fat)',
  weight: 'var(--color-zone-weight)',
  aerobic: 'var(--color-zone-aerobic)',
  anaerobic: 'var(--color-zone-anaerobic)',
}

export default function HeartRateZoneChart({ age }: { age: number | null }) {
  if (age == null || age < 1 || age > 120) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        Add a date of birth in <Link href="/settings" className="underline">Settings</Link> to see training heart-rate zones.
      </p>
    )
  }

  const width = 640
  const height = 280
  const pad = { top: 28, right: 16, bottom: 36, left: 48 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const ageMin = Math.min(20, age)
  const ageMax = Math.max(70, age)
  const top = zoneBoundsAtAge(ageMin).high
  const hi = top * 1.08
  const y = (bpm: number) => pad.top + innerH - (bpm / hi) * innerH
  const x = (years: number) => pad.left + ((years - ageMin) / (ageMax - ageMin)) * innerW
  const zones = heartRateZones(age)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => hi * t)
  const ageTicks = [ageMin, ...[20, 30, 40, 50, 60, 70].filter((n) => n > ageMin && n < ageMax), ageMax]
    .filter((n, i, all) => all.indexOf(n) === i)

  function band(lowPercent: number, highPercent: number) {
    const ages = [ageMin, ageMax]
    const upper = ages.map((years) => `${x(years)},${y(Math.round((maxHeartRate(years) * highPercent) / 100))}`)
    const lower = ages
      .slice()
      .reverse()
      .map((years) => `${x(years)},${y(Math.round((maxHeartRate(years) * lowPercent) / 100))}`)
    return `M ${upper.join(' L ')} L ${lower.join(' L ')} Z`
  }

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Training heart rate zones">
        {ticks.map((tick, i) => {
          const gy = pad.top + innerH * (1 - i / Math.max(ticks.length - 1, 1))
          return (
            <line key={`grid-${tick}`} x1={pad.left} x2={width - pad.right} y1={gy} y2={gy} stroke="var(--color-border)" />
          )
        })}
        {ticks.map((tick) => (
          <text key={`t-${tick}`} x={pad.left - 8} y={y(tick) + 4} fontSize="10" textAnchor="end" fill="var(--color-muted)">
            {Math.round(tick)}
          </text>
        ))}
        {zones.map((zone) => (
          <path key={zone.id} d={band(zone.lowPercent, zone.highPercent)} fill={zoneColor[zone.id]} opacity="0.85" />
        ))}
        <line x1={x(age)} x2={x(age)} y1={pad.top} y2={pad.top + innerH} stroke="var(--color-text)" strokeWidth="1.5" />
        <text x={x(age)} y={16} fontSize="11" textAnchor="middle" fill="var(--color-text)">
          Age {age}
        </text>
        {ageTicks.map((years) => (
          <text key={years} x={x(years)} y={height - 10} fontSize="9" textAnchor="middle" fill="var(--color-muted)">
            {years}
          </text>
        ))}
        <text x={pad.left} y={height - 22} fontSize="10" fill="var(--color-muted)">
          bpm
        </text>
      </svg>
      <ul className="grid sm:grid-cols-2 gap-2 text-sm">
        {zones.map((zone) => (
          <li key={zone.id} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: zoneColor[zone.id] }} />
            <span>
              {zone.label} {zone.lowPercent}–{zone.highPercent}%: {zone.low}–{zone.high} bpm
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Estimate from 220 − age ({maxHeartRate(age)} bpm max). Not a medical prescription.
      </p>
    </div>
  )
}
