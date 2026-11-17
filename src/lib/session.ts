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
  return prisma.user.findUnique({ where: { id: user.id } })
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
  if (!account.isActive) {
    return { account: null, error: NextResponse.json({ error: 'Account is inactive' }, { status: 403 }) }
  }
  return { account, error: null }
}

export async function requireAdmin() {
  const result = await requireAccount()
  if (result.error) return result
  if (result.account.role !== Role.ADMIN) {
    return { account: null, error: NextResponse.json({ error: 'Administrator access required' }, { status: 403 }) }
  }
  return result
}

/** Explicit target selection; authorization always uses the current database role. */
export async function requireManagedAccount(req: Request) {
  const result = await requireAccount()
  if (result.error) return result
  const targetId = new URL(req.url).searchParams.get('userId')
  if (targetId === null || targetId === result.account.id) return result
  if (result.account.role !== Role.ADMIN) {
    return { account: null, error: NextResponse.json({ error: 'Administrator access required' }, { status: 403 }) }
  }
  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) return { account: null, error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  return { account: target, error: null }
}
