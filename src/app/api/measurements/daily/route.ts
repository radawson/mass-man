import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/session'
import { averageProfile, presentDailyAverage, toAverageInput } from '@/lib/present'
import { dailyAverages } from '@/lib/daily-averages'

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const account = await prisma.user.findUnique({ where: { id: user.id } })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const rows = await prisma.measurement.findMany({
    where: {
      userId: user.id,
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
