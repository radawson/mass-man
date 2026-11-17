import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '../route'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/prisma', () => ({ prisma: { user: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() } } }))
jest.mock('@/lib/session', () => ({ requireAdmin: jest.fn() }))
const request = (body: object) => new NextRequest('http://localhost/api/admin/users', { method: 'POST', body: JSON.stringify(body) })

beforeEach(() => {
  jest.resetAllMocks()
  ;(requireAdmin as jest.Mock).mockResolvedValue({ account: { id: 'admin' }, error: null })
  ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
  ;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'person', email: 'person@example.org', name: 'Person' })
})

it('creates a normalized user with no password or administrative privileges by default', async () => {
  const response = await POST(request({ name: ' Person ', email: ' Person@Example.org ', role: 'ADMIN' }))
  expect(response.status).toBe(201)
  expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: {
    name: 'Person', email: 'person@example.org', password: null, role: 'USER',
  } }))
  expect(await response.json()).not.toHaveProperty('password')
})
it('hashes the optional local password', async () => {
  await POST(request({ name: 'Person', email: 'person@example.org', password: 'local-password' }))
  const data = (prisma.user.create as jest.Mock).mock.calls[0][0].data
  expect(await bcrypt.compare('local-password', data.password)).toBe(true)
})
it('returns 409 for existing case-insensitive matches', async () => {
  ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' })
  expect((await POST(request({ name: 'Person', email: 'person@example.org' }))).status).toBe(409)
  expect(prisma.user.create).not.toHaveBeenCalled()
})
it('handles a concurrent duplicate creation', async () => {
  ;(prisma.user.create as jest.Mock).mockRejectedValue({ code: 'P2002' })
  expect((await POST(request({ name: 'Person', email: 'person@example.org' }))).status).toBe(409)
})
it('validates input before writing', async () => {
  expect((await POST(request({ name: '', email: 'bad', password: 'short' }))).status).toBe(400)
  expect(prisma.user.create).not.toHaveBeenCalled()
})
it.each([401, 403])('blocks unauthorized list and create requests (%s)', async (status) => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ account: null, error: NextResponse.json({ error: 'Denied' }, { status }) })
  expect((await GET()).status).toBe(status)
  expect((await POST(request({ name: 'Person', email: 'person@example.org' }))).status).toBe(status)
  expect(prisma.user.findMany).not.toHaveBeenCalled()
  expect(prisma.user.create).not.toHaveBeenCalled()
})
