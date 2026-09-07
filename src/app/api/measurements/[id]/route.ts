import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/session'
import { presentMeasurement } from '@/lib/present'
import { lengthToCanonical, optionalLengthToCanonical, weightToCanonical } from '@/lib/serialize'
import { optionalDecimal, positiveDecimal } from '@/lib/zod-decimal'
import { z } from 'zod'

const updateSchema = z.object({
  recordedAt: z.string().min(1).optional(),
  weight: positiveDecimal.optional(),
  bodyFatPercentDevice: optionalDecimal,
  neck: optionalDecimal,
  shoulders: optionalDecimal,
  chest: optionalDecimal,
  waist: optionalDecimal,
  hips: optionalDecimal,
  leftUpperArm: optionalDecimal,
  rightUpperArm: optionalDecimal,
  leftThigh: optionalDecimal,
  rightThigh: optionalDecimal,
  leftCalf: optionalDecimal,
  rightCalf: optionalDecimal,
  note: z.string().nullable().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser()
  if (error) return error
  const { id } = await context.params

  const account = await prisma.user.findUnique({ where: { id: user.id } })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const row = await prisma.measurement.findFirst({
    where: { id, userId: user.id },
  })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(presentMeasurement(row, account))
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser()
  if (error) return error
  const { id } = await context.params

  try {
    const body = updateSchema.parse(await req.json())
    const account = await prisma.user.findUnique({ where: { id: user.id } })
    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const existing = await prisma.measurement.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const unit = account.displayUnit
    const row = await prisma.measurement.update({
      where: { id: existing.id },
      data: {
        recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
        weightKg: body.weight ? weightToCanonical(body.weight, unit) : undefined,
        bodyFatPercentDevice:
          body.bodyFatPercentDevice === undefined ? undefined : body.bodyFatPercentDevice ?? null,
        neckCm: body.neck === undefined ? undefined : optionalLengthToCanonical(body.neck, unit),
        shouldersCm:
          body.shoulders === undefined ? undefined : optionalLengthToCanonical(body.shoulders, unit),
        chestCm: body.chest === undefined ? undefined : optionalLengthToCanonical(body.chest, unit),
        waistCm: body.waist === undefined ? undefined : optionalLengthToCanonical(body.waist, unit),
        hipsCm: body.hips === undefined ? undefined : optionalLengthToCanonical(body.hips, unit),
        leftUpperArmCm:
          body.leftUpperArm === undefined
            ? undefined
            : optionalLengthToCanonical(body.leftUpperArm, unit),
        rightUpperArmCm:
          body.rightUpperArm === undefined
            ? undefined
            : optionalLengthToCanonical(body.rightUpperArm, unit),
        leftThighCm:
          body.leftThigh === undefined ? undefined : optionalLengthToCanonical(body.leftThigh, unit),
        rightThighCm:
          body.rightThigh === undefined
            ? undefined
            : optionalLengthToCanonical(body.rightThigh, unit),
        leftCalfCm:
          body.leftCalf === undefined ? undefined : optionalLengthToCanonical(body.leftCalf, unit),
        rightCalfCm:
          body.rightCalf === undefined ? undefined : optionalLengthToCanonical(body.rightCalf, unit),
        note: body.note === undefined ? undefined : body.note,
      },
    })

    return NextResponse.json(presentMeasurement(row, account))
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser()
  if (error) return error
  const { id } = await context.params

  const existing = await prisma.measurement.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.measurement.delete({ where: { id: existing.id } })
  return NextResponse.json({ success: true })
}
