import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccount } from '@/lib/session'
import { presentMeasurement } from '@/lib/present'
import { lengthToCanonical, optionalLengthToCanonical, weightToCanonical } from '@/lib/serialize'
import { optionalDecimal, optionalSteps } from '@/lib/zod-decimal'
import { z } from 'zod'

const createSchema = z
  .object({
    recordedAt: z.string().min(1),
    weight: optionalDecimal,
    steps: optionalSteps,
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
  .refine((data) => data.weight != null || data.steps != null, {
    message: 'Enter weight or steps',
  })
  .refine((data) => data.weight == null || Number(data.weight) > 0, {
    message: 'Weight must be a positive number',
  })

export async function GET() {
  const { account, error } = await requireAccount()
  if (error) return error

  const rows = await prisma.measurement.findMany({
    where: { userId: account.id },
    orderBy: { recordedAt: 'desc' },
  })

  return NextResponse.json(rows.map((row) => presentMeasurement(row, account)))
}

export async function POST(req: NextRequest) {
  const { account, error } = await requireAccount()
  if (error) return error

  try {
    const body = createSchema.parse(await req.json())

    const unit = account.displayUnit
    const row = await prisma.measurement.create({
      data: {
        userId: account.id,
        recordedAt: new Date(body.recordedAt),
        weightKg: body.weight ? weightToCanonical(body.weight, unit) : null,
        steps: body.steps ?? null,
        bodyFatPercentDevice: body.bodyFatPercentDevice ?? null,
        neckCm: optionalLengthToCanonical(body.neck, unit),
        shouldersCm: optionalLengthToCanonical(body.shoulders, unit),
        chestCm: optionalLengthToCanonical(body.chest, unit),
        waistCm: optionalLengthToCanonical(body.waist, unit),
        hipsCm: optionalLengthToCanonical(body.hips, unit),
        leftUpperArmCm: optionalLengthToCanonical(body.leftUpperArm, unit),
        rightUpperArmCm: optionalLengthToCanonical(body.rightUpperArm, unit),
        leftThighCm: optionalLengthToCanonical(body.leftThigh, unit),
        rightThighCm: optionalLengthToCanonical(body.rightThigh, unit),
        leftCalfCm: optionalLengthToCanonical(body.leftCalf, unit),
        rightCalfCm: optionalLengthToCanonical(body.rightCalf, unit),
        note: body.note,
      },
    })

    return NextResponse.json(presentMeasurement(row, account), { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
