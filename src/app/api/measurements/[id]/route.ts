import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccount } from '@/lib/session'
import { presentMeasurement } from '@/lib/present'
import { lengthToCanonical, optionalLengthToCanonical, weightToCanonical } from '@/lib/serialize'
import { storedTemperature } from '@/lib/vitals'
import { optionalDecimal, optionalDiastolic, optionalHeartRate, optionalSteps, optionalSystolic } from '@/lib/zod-decimal'
import { z } from 'zod'

const optionalOxygen = optionalDecimal.refine(
  (v) => v == null || (Number(v) >= 50 && Number(v) <= 100),
  { message: 'Oxygen saturation must be between 50 and 100' },
)

const updateSchema = z
  .object({
    recordedAt: z.string().min(1).optional(),
    weight: optionalDecimal,
    steps: optionalSteps,
    heartRate: optionalHeartRate,
    systolic: optionalSystolic,
    diastolic: optionalDiastolic,
    temperature: optionalDecimal,
    oxygenSaturation: optionalOxygen,
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
  .refine((data) => (data.systolic == null) === (data.diastolic == null), {
    message: 'Enter both blood pressure numbers',
  })
  .refine(
    (data) => data.systolic == null || data.diastolic == null || data.systolic > data.diastolic,
    { message: 'Systolic pressure must be higher than diastolic' },
  )

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  const { account, error } = await requireAccount()
  if (error) return error
  const { id } = await context.params

  const row = await prisma.measurement.findFirst({
    where: { id, userId: account.id },
  })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(presentMeasurement(row, account))
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { account, error } = await requireAccount()
  if (error) return error
  const { id } = await context.params

  try {
    const body = updateSchema.parse(await req.json())

    const existing = await prisma.measurement.findFirst({
      where: { id, userId: account.id },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const unit = account.displayUnit
    const row = await prisma.measurement.update({
      where: { id: existing.id },
      data: {
        recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
        weightKg:
          body.weight === undefined
            ? undefined
            : body.weight
              ? weightToCanonical(body.weight, unit)
              : null,
        steps: body.steps === undefined ? undefined : body.steps,
        heartRateBpm: body.heartRate === undefined ? undefined : body.heartRate,
        systolic: body.systolic === undefined ? undefined : body.systolic,
        diastolic: body.diastolic === undefined ? undefined : body.diastolic,
        temperatureC:
          body.temperature === undefined ? undefined : storedTemperature(body.temperature, unit),
        oxygenSaturation: body.oxygenSaturation === undefined ? undefined : body.oxygenSaturation,
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
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid input', details: err.issues }, { status: 400 })
    }
    if (err instanceof RangeError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { account, error } = await requireAccount()
  if (error) return error
  const { id } = await context.params

  const existing = await prisma.measurement.findFirst({
    where: { id, userId: account.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.measurement.delete({ where: { id: existing.id } })
  return NextResponse.json({ success: true })
}
