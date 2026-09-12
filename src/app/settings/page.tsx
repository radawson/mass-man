'use client'

import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/components/ThemeProvider'

type Me = {
  name: string
  displayUnit: 'METRIC' | 'IMPERIAL'
  theme: 'LIGHT' | 'DARK' | 'SYSTEM'
  timeZone: string
  sex: 'MALE' | 'FEMALE' | null
  bodyFatSource: 'DEVICE' | 'ESTIMATED' | 'AUTO'
  heightDisplay: string | null
}

const timeZones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
  'Europe/London',
  'Europe/Paris',
]

export default function SettingsPage() {
  const { setTheme } = useTheme()
  const [form, setForm] = useState<Me | null>(null)
  const [height, setHeight] = useState('')

  useEffect(() => {
    fetch('/api/me')
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        if (!data?.name) return
        setForm(data)
        setHeight(data.heightDisplay ?? '')
      })
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        displayUnit: form.displayUnit,
        theme: form.theme,
        timeZone: form.timeZone,
        sex: form.sex,
        bodyFatSource: form.bodyFatSource,
        height: height || null,
      }),
    })
    if (!res.ok) {
      toast.error('Could not save settings')
      return
    }
    await setTheme(form.theme)
    toast.success('Settings saved')
  }

  if (!form) {
    return (
      <>
        <Navbar />
        <main className="app-page-container">Loading…</main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="app-page-container max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <form onSubmit={onSubmit} className="card space-y-4">
          <label className="block text-sm">
            Name
            <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-sm">
            Units
            <select className="input mt-1" value={form.displayUnit} onChange={(e) => setForm({ ...form, displayUnit: e.target.value as Me['displayUnit'] })}>
              <option value="IMPERIAL">Imperial (lb / in)</option>
              <option value="METRIC">Metric (kg / cm)</option>
            </select>
          </label>
          <label className="block text-sm">
            Height ({form.displayUnit === 'IMPERIAL' ? 'in' : 'cm'})
            <input className="input mt-1" value={height} onChange={(e) => setHeight(e.target.value)} />
          </label>
          <label className="block text-sm">
            Sex (for Navy body-fat estimate)
            <select
              className="input mt-1"
              value={form.sex ?? ''}
              onChange={(e) => setForm({ ...form, sex: (e.target.value || null) as Me['sex'] })}
            >
              <option value="">Not set</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </label>
          <label className="block text-sm">
            Body fat source
            <select className="input mt-1" value={form.bodyFatSource} onChange={(e) => setForm({ ...form, bodyFatSource: e.target.value as Me['bodyFatSource'] })}>
              <option value="AUTO">Auto (device %, then Navy estimate)</option>
              <option value="DEVICE">Device % only</option>
              <option value="ESTIMATED">Navy estimate only</option>
            </select>
          </label>
          <label className="block text-sm">
            Time zone
            <select className="input mt-1" value={form.timeZone} onChange={(e) => setForm({ ...form, timeZone: e.target.value })}>
              {timeZones.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
              {!timeZones.includes(form.timeZone) && <option value={form.timeZone}>{form.timeZone}</option>}
            </select>
          </label>
          <label className="block text-sm">
            Theme
            <select className="input mt-1" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as Me['theme'] })}>
              <option value="SYSTEM">System</option>
              <option value="LIGHT">Light</option>
              <option value="DARK">Dark</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary">Save settings</button>
        </form>
      </main>
    </>
  )
}
