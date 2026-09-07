'use client'

import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'

type GoalView = {
  id: string
  metric: string
  direction: string
  start: string
  current: string | null
  target: string
  remaining: string | null
  progressPercent: number | null
  status: string
  milestoneReached: Record<string, boolean> | null
  milestoneTargets: Record<string, string> | null
  milestoneNotes: Record<string, string>
}

const metrics = ['WEIGHT', 'BODY_FAT', 'WAIST', 'CHEST', 'HIPS', 'UPPER_ARM', 'THIGH'] as const
const labels: Record<string, string> = {
  WEIGHT: 'Weight',
  BODY_FAT: 'Body Fat',
  WAIST: 'Waist',
  CHEST: 'Chest',
  HIPS: 'Hips',
  UPPER_ARM: 'Upper arm avg.',
  THIGH: 'Thigh avg.',
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalView[]>([])
  const [form, setForm] = useState({
    metric: 'WEIGHT',
    direction: 'DECREASE',
    startValue: '',
    targetValue: '',
    startDate: new Date().toISOString().slice(0, 10),
    note25: '',
    note50: '',
    note75: '',
    note100: '',
  })

  function load() {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => setGoals(data.goals ?? []))
  }

  useEffect(() => {
    load()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: form.metric,
        direction: form.direction,
        startValue: form.startValue,
        targetValue: form.targetValue,
        startDate: form.startDate,
        milestoneNotes: {
          '25': form.note25,
          '50': form.note50,
          '75': form.note75,
          '100': form.note100,
        },
      }),
    })
    if (!res.ok) {
      toast.error('Could not save goal')
      return
    }
    toast.success('Goal saved')
    load()
  }

  const selected = goals.find((g) => g.metric === form.metric)

  return (
    <>
      <Navbar />
      <main className="app-page-container space-y-6">
        <h1 className="text-3xl font-bold">Goals & milestones</h1>

        <div className="card overflow-x-auto">
          <h2 className="font-semibold mb-3">Goals overview</h2>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--color-muted)' }}>
                <th className="text-left py-2">Metric</th>
                <th>Direction</th>
                <th className="text-right">Start</th>
                <th className="text-right">Current</th>
                <th className="text-right">Target</th>
                <th className="text-right">Remaining</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={goal.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="py-2">{labels[goal.metric]}</td>
                  <td className="text-center">{goal.direction.toLowerCase()}</td>
                  <td className="text-right">{goal.start}</td>
                  <td className="text-right">{goal.current ?? '—'}</td>
                  <td className="text-right">{goal.target}</td>
                  <td className="text-right">{goal.remaining ?? '—'}</td>
                  <td className="px-2">
                    <div className="h-2 rounded" style={{ backgroundColor: 'var(--color-surface-2)' }}>
                      <div
                        className="h-2 rounded"
                        style={{
                          width: `${goal.progressPercent ?? 0}%`,
                          backgroundColor: 'var(--color-accent)',
                        }}
                      />
                    </div>
                  </td>
                  <td>{goal.progressPercent ?? 0}% {goal.status}</td>
                </tr>
              ))}
              {goals.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center" style={{ color: 'var(--color-muted)' }}>
                    Set a goal below to start tracking progress.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selected?.milestoneTargets && (
          <div className="card overflow-x-auto">
            <h2 className="font-semibold mb-3">Milestones — {labels[selected.metric]}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--color-muted)' }}>
                  <th className="text-left py-2">Milestone</th>
                  <th>Target %</th>
                  <th className="text-right">Target value</th>
                  <th className="text-right">Current</th>
                  <th>Reached</th>
                  <th className="text-left">Reward / note</th>
                </tr>
              </thead>
              <tbody>
                {(['25', '50', '75', '100'] as const).map((key) => (
                  <tr key={key} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="py-2">{key}% Progress</td>
                    <td className="text-center">{key}%</td>
                    <td className="text-right">{selected.milestoneTargets?.[key]}</td>
                    <td className="text-right">{selected.current ?? '—'}</td>
                    <td>{selected.milestoneReached?.[key] ? 'Yes' : 'Not yet'}</td>
                    <td>{selected.milestoneNotes?.[key] || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={onSubmit} className="card grid sm:grid-cols-2 gap-4">
          <h2 className="font-semibold sm:col-span-2">Set or update a goal</h2>
          <label className="text-sm">
            Metric
            <select className="input mt-1" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}>
              {metrics.map((m) => (
                <option key={m} value={m}>{labels[m]}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Direction
            <select className="input mt-1" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
              <option value="DECREASE">Decrease</option>
              <option value="INCREASE">Increase</option>
              <option value="MAINTAIN">Maintain</option>
            </select>
          </label>
          <label className="text-sm">
            Start
            <input className="input mt-1" required value={form.startValue} onChange={(e) => setForm({ ...form, startValue: e.target.value })} />
          </label>
          <label className="text-sm">
            Target
            <input className="input mt-1" required value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} />
          </label>
          <label className="text-sm sm:col-span-2">
            Start date
            <input className="input mt-1" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </label>
          {(['25', '50', '75', '100'] as const).map((key) => (
            <label key={key} className="text-sm">
              {key}% reward / note
              <input
                className="input mt-1"
                value={form[`note${key}` as 'note25']}
                onChange={(e) => setForm({ ...form, [`note${key}`]: e.target.value })}
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">Save goal</button>
          </div>
        </form>
      </main>
    </>
  )
}
