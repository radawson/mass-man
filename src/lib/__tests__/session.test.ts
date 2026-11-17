import { getServerSession } from 'next-auth'
import { prisma } from '../prisma'
import { requireAccount, requireAdmin, requireManagedAccount } from '../session'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('../auth', () => ({ authOptions: {} }))
jest.mock('../prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }))
jest.mock('@/generated/prisma/client', () => ({ Role: { USER: 'USER', ADMIN: 'ADMIN', GUEST: 'GUEST' } }))
const actor = { id: 'actor', role: 'USER', isActive: true }
const target = { id: 'target', role: 'USER', isActive: true }
const request = (query = '') => new Request(`http://localhost/api/measurements${query}`)

beforeEach(() => {
  jest.resetAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'actor', role: 'ADMIN' } })
  ;(prisma.user.findUnique as jest.Mock).mockImplementation(async ({ where }) => where.id === 'actor' ? actor : target)
})

it('returns 401 without a session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await requireManagedAccount(request('?userId=target'))).error?.status).toBe(401)
  expect(prisma.user.findUnique).not.toHaveBeenCalled()
})
it('uses the personal account by default', async () => {
  expect((await requireManagedAccount(request())).account).toEqual(actor)
})
it('denies cross-user access despite a stale admin JWT', async () => {
  expect((await requireManagedAccount(request('?userId=target'))).error?.status).toBe(403)
  expect(prisma.user.findUnique).toHaveBeenCalledTimes(1)
  expect((await requireAdmin()).error?.status).toBe(403)
})
it('allows current database admins to select a target', async () => {
  ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ ...actor, role: 'ADMIN' }).mockResolvedValueOnce(target)
  expect((await requireManagedAccount(request('?userId=target'))).account).toEqual(target)
})
it('returns 404 for missing targets instead of falling back to the admin account', async () => {
  ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ ...actor, role: 'ADMIN' }).mockResolvedValueOnce(null)
  expect((await requireManagedAccount(request('?userId=missing'))).error?.status).toBe(404)
})
it('rejects deactivated sessions', async () => {
  ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...actor, role: 'ADMIN', isActive: false })
  expect((await requireAdmin()).error?.status).toBe(403)
})
it('does not recreate a deleted account from its old session', async () => {
  ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
  expect((await requireAccount()).error?.status).toBe(404)
})
