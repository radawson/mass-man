import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccount } from '@/lib/session'
import { GoalDirection, GoalMetric } from '@/generated/prisma/client'
import { lengthToCanonical, weightToCanonical } from '@/lib/serialize'
import { decimalString } from '@/lib/zod-decimal'
import { z } from 'zod'

const goalSchema = z.object({
  metric: z.nativeEnum(GoalMetric),
  direction: z.nativeEnum(GoalDirection),
  startValue: decimalString,
  targetValue: decimalString,
  startDate: z.string().min(1),
  milestoneNotes: z
    .record(z.string(), z.string())
    .optional(),
})

function canonicalGoalValue(metric: GoalMetric, value: string, displayUnit: 'METRIC' | 'IMPERIAL') {
  if (metric === GoalMetric.WEIGHT) return weightToCanonical(value, displayUnit)
  if (metric === GoalMetric.BODY_FAT) return value
  return lengthToCanonical(value, displayUnit)
}

export async function GET() {
  const { account, error } = await requireAccount()
  if (error) return error

  const goals = await prisma.goal.findMany({
    where: { userId: account.id },
    orderBy: { metric: 'asc' },
  })
  return NextResponse.json(goals)
}

export async function POST(req: NextRequest) {
  const { account, error } = await requireAccount()
  if (error) return error

  try {
    const body = goalSchema.parse(await req.json())

    const goal = await prisma.goal.upsert({
      where: { userId_metric: { userId: account.id, metric: body.metric } },
      create: {
        userId: account.id,
        metric: body.metric,
        direction: body.direction,
        startValue: canonicalGoalValue(body.metric, body.startValue, account.displayUnit),
        targetValue: canonicalGoalValue(body.metric, body.targetValue, account.displayUnit),
        startDate: new Date(body.startDate),
        milestoneNotes: body.milestoneNotes,
      },
      update: {
        direction: body.direction,
        startValue: canonicalGoalValue(body.metric, body.startValue, account.displayUnit),
        targetValue: canonicalGoalValue(body.metric, body.targetValue, account.displayUnit),
        startDate: new Date(body.startDate),
        milestoneNotes: body.milestoneNotes,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
