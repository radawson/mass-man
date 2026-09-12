'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'

type Row = {
  id: string
  recordedAt: string
  weightDisplay: string | null
  bodyFatPercentDevice: string | null
  bodyFatPercentEstimated: string | null
  bodyFatPercentEffective: string | null
  bodyFatSourceUsed: string | null
  waist: string | null
  steps: number | null
}

export default function MeasurementsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [units, setUnits] = useState({ weight: 'lb', length: 'in' })

  useEffect(() => {
    Promise.all([
      fetch('/api/measurements').then((r) => r.json()),
      fetch('/api/me').then((r) => r.json()),
    ]).then(([list, me]) => {
      if (Array.isArray(list)) setRows(list)
      if (me?.unitLabels) setUnits(me.unitLabels)
    })
  }, [])

  async function remove(id: string) {
    if (!confirm('Delete this measurement?')) return
    const res = await fetch(`/api/measurements/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Delete failed')
      return
    }
    setRows((prev) => prev.filter((row) => row.id !== id))
    toast.success('Deleted')
  }

  return (
    <>
      <Navbar />
      <main className="app-page-container space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Measurements</h1>
          <Link href="/measurements/new" className="btn btn-primary">New</Link>
        </div>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--color-muted)' }}>
                <th className="text-left p-3">When</th>
                <th className="text-right p-3">Weight ({units.weight})</th>
                <th className="text-right p-3">Steps</th>
                <th className="text-right p-3">Device BF%</th>
                <th className="text-right p-3">Navy BF%</th>
                <th className="text-right p-3">Effective</th>
                <th className="text-right p-3">Waist ({units.length})</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3">{new Date(row.recordedAt).toLocaleString()}</td>
                  <td className="p-3 text-right">{row.weightDisplay ?? '—'}</td>
                  <td className="p-3 text-right">{row.steps != null ? row.steps.toLocaleString() : '—'}</td>
                  <td className="p-3 text-right">{row.bodyFatPercentDevice ?? '—'}</td>
                  <td className="p-3 text-right">{row.bodyFatPercentEstimated ?? '—'}</td>
                  <td className="p-3 text-right">
                    {row.bodyFatPercentEffective ?? '—'}
                    {row.bodyFatSourceUsed ? ` (${row.bodyFatSourceUsed.toLowerCase()})` : ''}
                  </td>
                  <td className="p-3 text-right">{row.waist ?? '—'}</td>
                  <td className="p-3 text-right space-x-2">
                    <button className="text-sm" style={{ color: 'var(--color-accent)' }} onClick={() => router.push(`/measurements/${row.id}`)}>Edit</button>
                    <button className="text-sm" style={{ color: 'var(--color-danger)' }} onClick={() => remove(row.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-6 text-center" colSpan={8} style={{ color: 'var(--color-muted)' }}>
                    No measurements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
