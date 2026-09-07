'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import TrendChart from '@/components/TrendChart'

type Dashboard = {
  units: { weight: string; length: string; system: string }
  kpis: {
    currentWeight: string | null
    weightChange: string | null
    bodyFatPercent: string | null
    waist: string | null
    unitSystem: string
    bmi: string | null
    leanMass: string | null
    overallProgress: number | null
    measurementDays: number
    goalStatus: string
  }
  chart: { date: string; weight: string | null; waist: string | null }[]
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

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setData)
  }, [])

  const k = data?.kpis
  const tiles = k
    ? [
        { label: `Current Weight (${data.units.weight})`, value: k.currentWeight ?? '—' },
        { label: `Weight Change (${data.units.weight})`, value: k.weightChange ?? '—' },
        { label: 'Body Fat (%)', value: k.bodyFatPercent ?? '—' },
        { label: `Waist (${data.units.length})`, value: k.waist ?? '—' },
        { label: 'Unit', value: k.unitSystem },
        { label: 'BMI', value: k.bmi ?? '—' },
        { label: `Lean Mass (${data.units.weight})`, value: k.leanMass ?? '—' },
        { label: 'Overall Progress', value: k.overallProgress != null ? `${k.overallProgress}%` : '—' },
        { label: 'Measurements', value: String(k.measurementDays) },
        { label: 'Goal Status', value: k.goalStatus },
      ]
    : []

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
            <h2 className="font-semibold mb-2">Weight and waist — last {data?.chart.length ?? 0} days</h2>
            <TrendChart
              points={data?.chart ?? []}
              weightLabel={`Weight (${data?.units.weight ?? 'lb'})`}
              waistLabel={`Waist (${data?.units.length ?? 'in'})`}
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
      </main>
    </>
  )
}
