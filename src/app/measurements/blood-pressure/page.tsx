'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

type Row = {
  id: string
  recordedAt: string
  systolic: number | null
  diastolic: number | null
  heartRateBpm: number | null
  temperatureDisplay: string | null
  temperatureUnit: string
  oxygenSaturation: string | null
}

export default function BloodPressurePage() {
  const [name, setName] = useState('')
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/measurements').then((res) => res.json()),
      fetch('/api/me').then((res) => res.json()),
    ]).then(([list, me]) => {
      if (Array.isArray(list)) {
        setRows(list.filter((row: Row) => row.systolic != null && row.diastolic != null))
      }
      if (me?.name) setName(me.name)
    })
  }, [])

  return (
    <>
      <Navbar />
      <main className="app-page-container space-y-4">
        <div className="no-print flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/measurements" className="text-sm" style={{ color: 'var(--color-accent)' }}>
              Measurements
            </Link>
            <h1 className="text-3xl font-bold mt-1">Blood pressure</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
              Print
            </button>
            <a className="btn btn-primary" href="/api/measurements/blood-pressure/pdf">
              Download PDF
            </a>
          </div>
        </div>

        <div className="hidden print:block mb-4">
          <p className="text-sm">Mezurilo</p>
          <h1 className="text-2xl font-bold">Blood pressure readings</h1>
          {name && <p>{name}</p>}
        </div>

        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--color-muted)' }}>
                <th className="text-left p-3">When</th>
                <th className="text-right p-3">Blood pressure</th>
                <th className="text-right p-3">Heart rate</th>
                <th className="text-right p-3">Temperature</th>
                <th className="text-right p-3">O2 sat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3">{new Date(row.recordedAt).toLocaleString()}</td>
                  <td className="p-3 text-right">{row.systolic}/{row.diastolic}</td>
                  <td className="p-3 text-right">{row.heartRateBpm ?? '—'}</td>
                  <td className="p-3 text-right">
                    {row.temperatureDisplay != null ? `${row.temperatureDisplay}${row.temperatureUnit}` : '—'}
                  </td>
                  <td className="p-3 text-right">{row.oxygenSaturation != null ? `${row.oxygenSaturation}%` : '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-6 text-center" colSpan={5} style={{ color: 'var(--color-muted)' }}>
                    No blood pressure readings yet.
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
