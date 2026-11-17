import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManagedAccount } from '@/lib/session'
import { presentUser } from '@/lib/present'
import { lengthToCanonical } from '@/lib/serialize'
import { z } from 'zod'
import {
  BodyFatSource,
  Sex,
  ThemePreference,
  UnitSystem,
} from '@/generated/prisma/client'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  displayUnit: z.nativeEnum(UnitSystem).optional(),
  theme: z.nativeEnum(ThemePreference).optional(),
  timeZone: z.string().refine((value) => {
    try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true } catch { return false }
  }, 'Invalid time zone').optional(),
  sex: z.nativeEnum(Sex).nullable().optional(),
  bodyFatSource: z.nativeEnum(BodyFatSource).optional(),
  height: z.union([z.string(), z.number(), z.null()]).optional(),
  stepsGoal: z.coerce.number().int().min(1).max(250000).optional(),
  dateOfBirth: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(''), z.null()])
    .optional(),
})

export async function GET(req: Request) {
  const { account, error } = await requireManagedAccount(req)
  if (error) return error
  return NextResponse.json(presentUser(account))
}

export async function PATCH(req: NextRequest) {
  const { account, error } = await requireManagedAccount(req)
  if (error) return error

  try {
    const body = patchSchema.parse(await req.json())
    const current = account

    const unit = body.displayUnit ?? current.displayUnit
    const heightCm =
      body.height === undefined
        ? undefined
        : body.height == null || body.height === ''
          ? null
          : lengthToCanonical(String(body.height), unit)

    if (heightCm != null && (!Number.isFinite(Number(heightCm)) || Number(heightCm) <= 0 || Number(heightCm) > 9999)) {
      return NextResponse.json({ error: 'Height must be a positive number below 9999 cm' }, { status: 400 })
    }
    if (body.dateOfBirth && (new Date(`${body.dateOfBirth}T00:00:00.000Z`).toISOString().slice(0, 10) !== body.dateOfBirth || body.dateOfBirth > new Date().toISOString().slice(0, 10))) {
      return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
    }
    const updated = await prisma.user.update({
      where: { id: account.id },
      data: {
        name: body.name,
        displayUnit: body.displayUnit,
        theme: body.theme,
        timeZone: body.timeZone,
        sex: body.sex,
        bodyFatSource: body.bodyFatSource,
        heightCm,
        stepsGoal: body.stepsGoal,
        dateOfBirth:
          body.dateOfBirth === undefined
            ? undefined
            : body.dateOfBirth
              ? new Date(`${body.dateOfBirth}T00:00:00.000Z`)
              : null,
      },
    })

    return NextResponse.json(presentUser(updated))
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 })
    }
    if (err instanceof RangeError) {
      return NextResponse.json({ error: 'Invalid profile value' }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
