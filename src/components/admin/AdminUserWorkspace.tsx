'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import MeasurementForm from '@/components/MeasurementForm'
import ProfileSettings from '@/components/ProfileSettings'
import BloodPressureReport from '@/components/BloodPressureReport'
import type { presentMeasurement, presentUser } from '@/lib/present'

type Measurement = ReturnType<typeof presentMeasurement>
type Profile = ReturnType<typeof presentUser>
type Tab = 'history' | 'log' | 'profile' | 'blood-pressure'

function formValues(row: Measurement) {
  return {
    recordedAt: row.recordedAt, weight: row.weightDisplay ?? '',
    steps: row.steps == null ? '' : String(row.steps),
    heartRate: row.heartRateBpm == null ? '' : String(row.heartRateBpm),
    systolic: row.systolic == null ? '' : String(row.systolic),
    diastolic: row.diastolic == null ? '' : String(row.diastolic),
    temperature: row.temperatureDisplay ?? '', oxygenSaturation: row.oxygenSaturation ?? '',
    bodyFatPercentDevice: row.bodyFatPercentDevice ?? '',
    neck: row.neck ?? '', shoulders: row.shoulders ?? '', chest: row.chest ?? '', waist: row.waist ?? '', hips: row.hips ?? '',
    leftUpperArm: row.leftUpperArm ?? '', rightUpperArm: row.rightUpperArm ?? '',
    leftThigh: row.leftThigh ?? '', rightThigh: row.rightThigh ?? '',
    leftCalf: row.leftCalf ?? '', rightCalf: row.rightCalf ?? '', note: row.note ?? '',
  }
}

export default function AdminUserWorkspace({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rows, setRows] = useState<Measurement[]>([])
  const [tab, setTab] = useState<Tab>('history')
  const [editing, setEditing] = useState<Measurement | null>(null)
  const [status, setStatus] = useState('Loading…')
  const [version, setVersion] = useState(0)
  const query = `?userId=${encodeURIComponent(userId)}`

  const load = useCallback(async () => {
    try {
      const responses = await Promise.all([fetch(`/api/me${query}`), fetch(`/api/measurements${query}`)])
      if (responses.some((res) => !res.ok)) throw new Error('Could not load this user')
      const [person, measurements] = await Promise.all(responses.map((res) => res.json()))
      setProfile(person); setRows(measurements); setStatus('')
    } catch { setStatus('Could not load this user. Please reload to try again.') }
  }, [query])
  useEffect(() => { void load() }, [load])

  function saved() {
    setEditing(null); setTab('history'); setVersion((value) => value + 1); void load()
  }

  async function remove(id: string) {
    if (!confirm(`Delete this measurement for ${profile?.name}?`)) return
    try {
      const res = await fetch(`/api/measurements/${id}${query}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Measurement deleted'); void load()
    } catch { toast.error('Could not delete measurement') }
  }

  return (
    <main className="app-page-container space-y-6">
      <Link className="no-print" href="/admin/users" style={{ color: 'var(--color-accent)' }}>← Users</Link>
      {status && <p role="status">{status}</p>}
      {profile && <>
        <div className="no-print card space-y-2">
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Managing another person’s profile and measurements</p>
          <h1 className="text-3xl font-bold">{profile.name}</h1><p>{profile.email}</p>
          <p className="text-sm">Units: {profile.unitLabels.system} · Time zone: {profile.timeZone}</p>
        </div>
        <div className="no-print flex flex-wrap gap-2" aria-label="User management sections">
          {([['history', 'Measurements'], ['log', 'Log measurement'], ['profile', 'Profile'], ['blood-pressure', 'Blood pressure']] as const).map(([value, label]) => (
            <button key={value} type="button" className={`btn ${tab === value ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={tab === value} onClick={() => { setTab(value); setEditing(null) }}>{label}</button>
          ))}
        </div>
        {tab === 'profile' && <ProfileSettings userId={userId} onSaved={saved} />}
        {tab === 'log' && <section className="card"><h2 className="text-xl font-semibold mb-4">{editing ? 'Edit' : 'Log'} measurement for {profile.name}</h2><MeasurementForm key={`${editing?.id ?? 'new'}-${version}`} userId={userId} measurementId={editing?.id} initial={editing ? formValues(editing) : undefined} onSaved={saved} /></section>}
        {tab === 'blood-pressure' && <BloodPressureReport key={version} userId={userId} backHref={`/admin/users/${userId}`} />}
        {tab === 'history' && <div className="table-wrap"><table className="w-full text-sm">
          <thead><tr><th className="text-left p-3">When ({profile.timeZone})</th><th className="p-3">Weight ({profile.unitLabels.weight})</th><th className="p-3">Blood pressure</th><th className="p-3">Heart rate (bpm)</th><th className="p-3">Notes</th><th className="p-3">Actions</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
            <td className="p-3">{new Date(row.recordedAt).toLocaleString(undefined, { timeZone: profile.timeZone })}</td>
            <td className="p-3 text-right">{row.weightDisplay ?? '—'}</td>
            <td className="p-3 text-right">{row.systolic != null && row.diastolic != null ? `${row.systolic}/${row.diastolic}` : '—'}</td>
            <td className="p-3 text-right">{row.heartRateBpm ?? '—'}</td><td className="p-3">{row.note ?? ''}</td>
            <td className="p-3"><div className="flex gap-2"><button className="btn btn-secondary" onClick={() => { setEditing(row); setTab('log') }}>Edit</button><button className="btn btn-secondary" onClick={() => void remove(row.id)}>Delete</button></div></td>
          </tr>)}{rows.length === 0 && <tr><td className="p-6 text-center" colSpan={6}>No measurements yet. Choose Log measurement to add blood pressure, heart rate, or other stats.</td></tr>}</tbody>
        </table></div>}
      </>}
    </main>
  )
}
