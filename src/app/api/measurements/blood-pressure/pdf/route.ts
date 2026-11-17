import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManagedAccount } from '@/lib/session'
import { presentMeasurement } from '@/lib/present'
import { bloodPressurePdf } from '@/lib/blood-pressure-pdf'

export async function GET(req: Request) {
  const { account, error } = await requireManagedAccount(req)
  if (error) return error

  const rows = await prisma.measurement.findMany({
    where: { userId: account.id, systolic: { not: null }, diastolic: { not: null } },
    orderBy: { recordedAt: 'desc' },
  })

  const pdf = await bloodPressurePdf(
    account.name,
    rows.map((row) => {
      const presented = presentMeasurement(row, account)
      return {
        recordedAt: presented.recordedAt,
        systolic: presented.systolic!,
        diastolic: presented.diastolic!,
        heartRateBpm: presented.heartRateBpm,
        temperatureDisplay: presented.temperatureDisplay,
        temperatureUnit: presented.temperatureUnit,
        oxygenSaturation: presented.oxygenSaturation,
      }
    }),
    account.timeZone,
  )

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="blood-pressure.pdf"',
    },
  })
}
