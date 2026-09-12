import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccount } from '@/lib/session'
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
  name: z.string().min(1).optional(),
  displayUnit: z.nativeEnum(UnitSystem).optional(),
  theme: z.nativeEnum(ThemePreference).optional(),
  timeZone: z.string().min(1).optional(),
  sex: z.nativeEnum(Sex).nullable().optional(),
  bodyFatSource: z.nativeEnum(BodyFatSource).optional(),
  height: z.union([z.string(), z.number(), z.null()]).optional(),
  stepsGoal: z.coerce.number().int().min(1).max(250000).optional(),
})

export async function GET() {
  const { account, error } = await requireAccount()
  if (error) return error
  return NextResponse.json(presentUser(account))
}

export async function PATCH(req: NextRequest) {
  const { account, error } = await requireAccount()
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
      },
    })

    return NextResponse.json(presentUser(updated))
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
