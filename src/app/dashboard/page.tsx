'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import TrendChart from '@/components/TrendChart'
import StepsBarChart, { DEFAULT_STEPS_GOAL } from '@/components/StepsBarChart'
import HeartRateZoneChart from '@/components/HeartRateZoneChart'

type Dashboard = {
  units: { weight: string; length: string; system: string }
  kpis: {
    currentWeight: string | null
    weightChange: string | null
    bodyFatPercent: string | null
    steps: number | null
    waist: string | null
    unitSystem: string
    bmi: string | null
    bmiCategory: string | null
    leanMass: string | null
    overallProgress: number | null
    measurementDays: number
    goalStatus: string
  }
  chart: { date: string; weight: string | null; bodyFat: string | null; steps: number | null }[]
  stepsGoal: number
  heartRate: { age: number } | null
  comparison: {
    metric: string
    start: string | null
    current: string | null
    change: string | null
    improved: boolean | null
  }[]
}

const metricLabel: Record<string, string> = {
  WEIGHT: 'Weight',
  BODY_FAT: 'Body Fat',
  WAIST: 'Waist',
  CHEST: 'Chest',
  HIPS: 'Hips',
  UPPER_ARM: 'Upper arm',
  THIGH: 'Thigh',
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [stepsGoal, setStepsGoal] = useState(DEFAULT_STEPS_GOAL)
  const [stepsGoalInput, setStepsGoalInput] = useState(String(DEFAULT_STEPS_GOAL))

  useEffect(() => {
    fetch('/api/dashboard')
      .then(async (res) => {
        const body = await res.json().catch(() => null)
        if (!res.ok || !body?.units || !body?.kpis) {
          setLoadError(res.status === 401 ? 'Please sign in again.' : 'Could not load dashboard.')
          return
        }
        setLoadError(null)
        setData(body)
        if (typeof body.stepsGoal === 'number') {
          setStepsGoal(body.stepsGoal)
          setStepsGoalInput(String(body.stepsGoal))
        }
      })
      .catch(() => setLoadError('Could not load dashboard.'))
  }, [])

  const k = data?.kpis
  const tiles = k
    ? [
        { label: `Current Weight (${data?.units?.weight ?? 'lb'})`, value: k.currentWeight ?? '—' },
        { label: `Weight Change (${data?.units?.weight ?? 'lb'})`, value: k.weightChange ?? '—' },
        { label: 'Body Fat (%)', value: k.bodyFatPercent ?? '—' },
        { label: 'Steps', value: k.steps != null ? k.steps.toLocaleString() : '—' },
        { label: `Waist (${data?.units?.length ?? 'in'})`, value: k.waist ?? '—' },
        { label: 'Unit', value: k.unitSystem },
        { label: 'BMI', value: k.bmi ? (k.bmiCategory ? `${k.bmi} · ${k.bmiCategory}` : k.bmi) : '—' },
        { label: `Lean Mass (${data?.units?.weight ?? 'lb'})`, value: k.leanMass ?? '—' },
        { label: 'Overall Progress', value: k.overallProgress != null ? `${k.overallProgress}%` : '—' },
        { label: 'Measurements', value: String(k.measurementDays) },
        { label: 'Goal Status', value: k.goalStatus },
      ]
    : []

  async function saveStepsGoal() {
    const parsed = Number(stepsGoalInput)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 250000) {
      setStepsGoalInput(String(stepsGoal))
      return
    }
    if (parsed === stepsGoal) return
    setStepsGoal(parsed)
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepsGoal: parsed }),
    })
    if (!res.ok) {
      const previous = data?.stepsGoal ?? DEFAULT_STEPS_GOAL
      setStepsGoal(previous)
      setStepsGoalInput(String(previous))
    }
  }

  return (
    <>
      <Navbar />
      <main className="app-page-container space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.25em]" style={{ color: 'var(--color-accent)' }}>BODY PROGRESS DASHBOARD</p>
            <h1 className="text-3xl font-bold mt-1">Overview</h1>
          </div>
          <Link href="/measurements/new" className="btn btn-primary">Log measurement</Link>
        </div>

        {loadError && (
          <div className="card" style={{ color: 'var(--color-danger)' }}>
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {tiles.map((tile) => (
            <div key={tile.label} className="kpi-tile">
              <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>{tile.label}</div>
              <div className="text-2xl font-semibold mt-1">{tile.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <div className="card lg:col-span-3">
            <h2 className="font-semibold mb-2">Weight and body fat</h2>
            <TrendChart
              points={data?.chart ?? []}
              weightLabel={`Weight (${data?.units?.weight ?? 'lb'})`}
              bodyFatLabel="Body fat (%)"
            />
          </div>
          <div className="card lg:col-span-2 overflow-x-auto">
            <h2 className="font-semibold mb-3">Start vs current</h2>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--color-muted)' }}>
                  <th className="text-left py-2">Metric</th>
                  <th className="text-right">Start</th>
                  <th className="text-right">Current</th>
                  <th className="text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {(data?.comparison ?? []).map((row) => (
                  <tr key={row.metric} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="py-2">{metricLabel[row.metric] ?? row.metric}</td>
                    <td className="text-right">{row.start ?? '—'}</td>
                    <td className="text-right">{row.current ?? '—'}</td>
                    <td
                      className="text-right font-medium"
                      style={{ color: row.improved ? 'var(--color-success)' : row.improved === false ? 'var(--color-danger)' : 'inherit' }}
                    >
                      {row.change ?? '—'} {row.improved == null ? '' : row.improved ? '▼' : '▲'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
            <h2 className="font-semibold">Steps per day</h2>
            <label className="text-sm flex items-center gap-2">
              Daily goal
              <input
                className="input w-28"
                type="number"
                min={1}
                step={1}
                value={stepsGoalInput}
                onChange={(e) => setStepsGoalInput(e.target.value)}
                onBlur={() => void saveStepsGoal()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur()
                  }
                }}
              />
            </label>
          </div>
          <StepsBarChart points={data?.chart ?? []} goal={stepsGoal} />
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Training heart rate zones</h2>
          <HeartRateZoneChart age={data?.heartRate?.age ?? null} />
        </div>
      </main>
    </>
  )
}
