'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MeasurementForm from '@/components/MeasurementForm'

export default function EditMeasurementPage() {
  const params = useParams<{ id: string }>()
  const [initial, setInitial] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    fetch(`/api/measurements/${params.id}`)
      .then((res) => res.json())
      .then((row) => {
        setInitial({
          recordedAt: row.recordedAt,
          weight: row.weightDisplay ?? '',
          bodyFatPercentDevice: row.bodyFatPercentDevice ?? '',
          steps: row.steps != null ? String(row.steps) : '',
          neck: row.neck ?? '',
          shoulders: row.shoulders ?? '',
          chest: row.chest ?? '',
          waist: row.waist ?? '',
          hips: row.hips ?? '',
          leftUpperArm: row.leftUpperArm ?? '',
          rightUpperArm: row.rightUpperArm ?? '',
          leftThigh: row.leftThigh ?? '',
          rightThigh: row.rightThigh ?? '',
          leftCalf: row.leftCalf ?? '',
          rightCalf: row.rightCalf ?? '',
          note: row.note ?? '',
        })
      })
  }, [params.id])

  return (
    <>
      <Navbar />
      <main className="app-page-container max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Edit measurement</h1>
        {initial ? <MeasurementForm measurementId={params.id} initial={initial} /> : <p>Loading…</p>}
      </main>
    </>
  )
}
