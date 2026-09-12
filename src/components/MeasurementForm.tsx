'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { navyBodyFatPercent } from '@/lib/navy-body-fat'
import { inToCm } from '@/lib/units'

type Prefs = {
  displayUnit: 'METRIC' | 'IMPERIAL'
  sex: 'MALE' | 'FEMALE' | null
  heightCm: string | null
  unitLabels: { weight: string; length: string }
}

const empty = {
  recordedAt: toDateTimeLocal(),
  weight: '',
  steps: '',
  bodyFatPercentDevice: '',
  neck: '',
  shoulders: '',
  chest: '',
  waist: '',
  hips: '',
  leftUpperArm: '',
  rightUpperArm: '',
  leftThigh: '',
  rightThigh: '',
  leftCalf: '',
  rightCalf: '',
  note: '',
}

function toDateTimeLocal(iso?: string) {
  const date = iso ? new Date(iso) : new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function emptyToNull(value: string) {
  return value.trim() === '' ? null : value
}

export default function MeasurementForm({
  measurementId,
  initial,
}: {
  measurementId?: string
  initial?: Partial<typeof empty> & { recordedAt?: string }
}) {
  const router = useRouter()
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [saving, setSaving] = useState(false)
  const [showTapes, setShowTapes] = useState(
    Boolean(initial && (initial.neck || initial.waist || initial.hips || initial.chest)),
  )
  const [form, setForm] = useState({ ...empty, ...initial, recordedAt: toDateTimeLocal(initial?.recordedAt) })

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then(setPrefs)
      .catch(() => toast.error('Could not load preferences'))
  }, [])

  const estimate = useMemo(() => {
    if (!prefs?.sex || !prefs.heightCm || !form.neck || !form.waist) return null
    if (prefs.sex === 'FEMALE' && !form.hips) return null
    const unit = prefs.displayUnit
    const toCm = (v: string) => (unit === 'IMPERIAL' ? inToCm(v).toString() : v)
    return navyBodyFatPercent({
      sex: prefs.sex,
      heightCm: prefs.heightCm,
      neckCm: toCm(form.neck),
      waistCm: toCm(form.waist),
      hipsCm: form.hips ? toCm(form.hips) : null,
    })
  }, [form.hips, form.neck, form.waist, prefs])

  const onChange = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (!form.weight.trim() && !form.steps.trim()) {
        toast.error('Enter weight or steps')
        return
      }
      const payload = {
        recordedAt: new Date(form.recordedAt).toISOString(),
        weight: emptyToNull(form.weight),
        steps: emptyToNull(form.steps),
        bodyFatPercentDevice: emptyToNull(form.bodyFatPercentDevice),
        neck: emptyToNull(form.neck),
        shoulders: emptyToNull(form.shoulders),
        chest: emptyToNull(form.chest),
        waist: emptyToNull(form.waist),
        hips: emptyToNull(form.hips),
        leftUpperArm: emptyToNull(form.leftUpperArm),
        rightUpperArm: emptyToNull(form.rightUpperArm),
        leftThigh: emptyToNull(form.leftThigh),
        rightThigh: emptyToNull(form.rightThigh),
        leftCalf: emptyToNull(form.leftCalf),
        rightCalf: emptyToNull(form.rightCalf),
        note: emptyToNull(form.note),
      }
      const url = measurementId ? `/api/measurements/${measurementId}` : '/api/measurements'
      const res = await fetch(url, {
        method: measurementId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Save failed')
        return
      }
      toast.success(measurementId ? 'Measurement updated' : 'Measurement logged')
      router.push('/measurements')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const w = prefs?.unitLabels.weight ?? 'lb'
  const l = prefs?.unitLabels.length ?? 'in'

  const tape = (
    name: keyof typeof empty,
    label: string,
  ) => (
    <label className="block text-sm">
      <span className="mb-1 block" style={{ color: 'var(--color-muted)' }}>{label} ({l})</span>
      <input className="input" type="number" step="0.1" value={form[name]} onChange={onChange(name)} />
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block text-sm">
          <span className="mb-1 block" style={{ color: 'var(--color-muted)' }}>Date and time</span>
          <input className="input" type="datetime-local" required value={form.recordedAt} onChange={onChange('recordedAt')} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block" style={{ color: 'var(--color-muted)' }}>Weight ({w})</span>
          <input className="input" type="number" step="0.1" value={form.weight} onChange={onChange('weight')} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block" style={{ color: 'var(--color-muted)' }}>Steps</span>
          <input className="input" type="number" step="1" min="0" value={form.steps} onChange={onChange('steps')} />
        </label>
      </div>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        Log weight, steps, or both. If you log steps more than once in a day, the latest count is the day’s total.
      </p>

      <div className="card space-y-3">
        <h3 className="font-semibold">Body fat % (device)</h3>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Optional reading from a scale or other device, e.g. 30.2
        </p>
        <input
          className="input max-w-xs"
          type="number"
          step="0.1"
          placeholder="30.2"
          value={form.bodyFatPercentDevice}
          onChange={onChange('bodyFatPercentDevice')}
        />
      </div>

      <div className="card space-y-4">
        <button type="button" className="btn btn-secondary" onClick={() => setShowTapes((v) => !v)}>
          {showTapes ? 'Hide' : 'Show'} tape measurements
        </button>
        {showTapes && (
          <>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              US Navy estimate uses neck and waist{prefs?.sex === 'FEMALE' ? ', plus hips' : ''}. Set sex and height in Settings first.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {tape('neck', 'Neck')}
              {tape('shoulders', 'Shoulders')}
              {tape('chest', 'Chest')}
              {tape('waist', 'Waist')}
              {tape('hips', 'Hips')}
              {tape('leftUpperArm', 'Left upper arm')}
              {tape('rightUpperArm', 'Right upper arm')}
              {tape('leftThigh', 'Left thigh')}
              {tape('rightThigh', 'Right thigh')}
              {tape('leftCalf', 'Left calf')}
              {tape('rightCalf', 'Right calf')}
            </div>
            <p className="text-sm">
              Estimated BF% (Navy):{' '}
              <strong>{estimate ? `${estimate.toFixed(1)}%` : '—'}</strong>
            </p>
          </>
        )}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block" style={{ color: 'var(--color-muted)' }}>Note</span>
        <textarea className="input" rows={3} value={form.note} onChange={onChange('note')} />
      </label>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Saving…' : measurementId ? 'Save changes' : 'Save measurement'}
      </button>
    </form>
  )
}
