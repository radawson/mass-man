import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { Role, User } from '@/generated/prisma/client'
import { authOptions } from './auth'
import { prisma } from './prisma'

type SessionUser = {
  id: string
  email?: string | null
  name?: string | null
  role?: Role
  isKeycloakUser?: boolean
}

export async function requireUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { user: session.user, error: null }
}

export async function resolveAccount(user: SessionUser): Promise<User | null> {
  const byId = await prisma.user.findUnique({ where: { id: user.id } })
  if (byId) return byId

  if (user.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: user.email } })
    if (byEmail) return byEmail
  }

  if (user.email) {
    try {
      return await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name || 'User',
          role: user.role ?? Role.USER,
          isKeycloakUser: user.isKeycloakUser ?? false,
        },
      })
    } catch (error) {
      console.error('Failed to provision session user', error)
      return prisma.user.findUnique({ where: { email: user.email } })
    }
  }

  return null
}

export async function requireAccount(): Promise<
  { account: User; error: null } | { account: null; error: NextResponse }
> {
  const { user, error } = await requireUser()
  if (error || !user) {
    return { account: null, error: error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const account = await resolveAccount(user)
  if (!account) {
    return { account: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { account, error: null }
}
