import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { normalizeEmail, emailFilter } from '@/lib/email'

const createSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320).transform(normalizeEmail),
  password: z.string().min(8).max(128).optional(),
})

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const users = await prisma.user.findMany({
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
    select: { id: true, name: true, email: true, role: true, isActive: true, isKeycloakUser: true },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = createSchema.parse(await req.json())
    const existing = await prisma.user.findFirst({
      where: { email: emailFilter(body.email) },
    })
    if (existing) return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 })
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password ? await bcrypt.hash(body.password, 10) : null,
        role: 'USER',
      },
      select: { id: true, name: true, email: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }
    if ((err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 })
    }
    console.error('Admin user creation failed', err)
    return NextResponse.json({ error: 'Could not create user' }, { status: 500 })
  }
}
