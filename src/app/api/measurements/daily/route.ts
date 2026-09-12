import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccount } from '@/lib/session'
import { averageProfile, presentDailyAverage, toAverageInput } from '@/lib/present'
import { dailyAverages } from '@/lib/daily-averages'

export async function GET(req: NextRequest) {
  const { account, error } = await requireAccount()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const rows = await prisma.measurement.findMany({
    where: {
      userId: account.id,
      ...(from || to
        ? {
            recordedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { recordedAt: 'asc' },
  })

  const days = dailyAverages(rows.map(toAverageInput), averageProfile(account))
  return NextResponse.json(days.map((day) => presentDailyAverage(day, account.displayUnit)))
}
