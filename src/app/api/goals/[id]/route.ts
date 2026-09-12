import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccount } from '@/lib/session'
import { GoalDirection, GoalMetric, Prisma } from '@/generated/prisma/client'
import { lengthToCanonical, weightToCanonical } from '@/lib/serialize'
import { decimalString } from '@/lib/zod-decimal'
import { z } from 'zod'

const patchSchema = z.object({
  direction: z.nativeEnum(GoalDirection).optional(),
  startValue: decimalString.optional(),
  targetValue: decimalString.optional(),
  startDate: z.string().min(1).optional(),
  milestoneNotes: z.record(z.string(), z.string()).nullable().optional(),
})

function canonicalGoalValue(metric: GoalMetric, value: string, displayUnit: 'METRIC' | 'IMPERIAL') {
  if (metric === GoalMetric.WEIGHT) return weightToCanonical(value, displayUnit)
  if (metric === GoalMetric.BODY_FAT) return value
  return lengthToCanonical(value, displayUnit)
}

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { account, error } = await requireAccount()
  if (error) return error
  const { id } = await context.params

  try {
    const body = patchSchema.parse(await req.json())

    const existing = await prisma.goal.findFirst({ where: { id, userId: account.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.goal.update({
      where: { id: existing.id },
      data: {
        direction: body.direction,
        startValue: body.startValue
          ? canonicalGoalValue(existing.metric, body.startValue, account.displayUnit)
          : undefined,
        targetValue: body.targetValue
          ? canonicalGoalValue(existing.metric, body.targetValue, account.displayUnit)
          : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        milestoneNotes:
          body.milestoneNotes === undefined
            ? undefined
            : body.milestoneNotes === null
              ? Prisma.JsonNull
              : body.milestoneNotes,
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { account, error } = await requireAccount()
  if (error) return error
  const { id } = await context.params

  const existing = await prisma.goal.findFirst({ where: { id, userId: account.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.goal.delete({ where: { id: existing.id } })
  return NextResponse.json({ success: true })
}
