import { linkKeycloakAccount } from '../keycloak-account'
import { prisma } from '../prisma'

jest.mock('../prisma', () => ({ prisma: { $transaction: jest.fn() } }))

const tx = { user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn() } }
const input = { subject: 'sso-subject', email: ' Person@Example.org ', emailVerified: true, name: 'SSO name', role: 'USER' as const }
const local = { id: 'local-id', email: 'person@example.org', name: 'Existing name', role: 'USER', isActive: true, isKeycloakUser: false, keycloakSubject: null }

beforeEach(() => {
  jest.resetAllMocks()
  ;(prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx))
  tx.user.findUnique.mockResolvedValue(null)
  tx.user.findMany.mockResolvedValue([])
  tx.user.update.mockImplementation(async ({ where, data }) => ({ ...local, id: where.id, ...data }))
  tx.user.create.mockImplementation(async ({ data }) => ({ id: 'new-id', ...data }))
})

it('links a mixed-case email to the original ID without replacing the name or history', async () => {
  tx.user.findMany.mockResolvedValue([local])
  const user = await linkKeycloakAccount(input)
  expect(user.id).toBe('local-id')
  expect(user.name).toBe('Existing name')
  expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'local-id', isActive: true, OR: [{ keycloakSubject: null }, { keycloakSubject: 'sso-subject' }] }, data: {
    keycloakSubject: 'sso-subject', email: 'person@example.org', role: 'USER', isKeycloakUser: true, password: null,
  } })
  expect(tx.user.create).not.toHaveBeenCalled()
})

it('uses the permanent subject link after an email change', async () => {
  tx.user.findUnique.mockResolvedValueOnce({ ...local, keycloakSubject: 'sso-subject' })
  await linkKeycloakAccount({ ...input, email: 'new@example.org' })
  expect(tx.user.findMany).not.toHaveBeenCalled()
  expect(tx.user.update.mock.calls[0][0].where.id).toBe('local-id')
  expect(tx.user.update.mock.calls[0][0].data.email).toBe('new@example.org')
})

it('adopts legacy SSO accounts by subject-as-ID', async () => {
  tx.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...local, id: 'sso-subject', isKeycloakUser: true })
  expect((await linkKeycloakAccount(input)).id).toBe('sso-subject')
  expect(tx.user.findMany).not.toHaveBeenCalled()
})

it('creates a new SSO account when no match exists', async () => {
  expect((await linkKeycloakAccount(input)).id).toBe('new-id')
  expect(tx.user.create.mock.calls[0][0].data.email).toBe('person@example.org')
})

it.each([
  { ...local, isActive: false },
  { ...local, keycloakSubject: 'someone-else' },
])('rejects inactive or already-linked matches', async (existing) => {
  tx.user.findMany.mockResolvedValue([existing])
  await expect(linkKeycloakAccount(input)).rejects.toThrow()
  expect(tx.user.update).not.toHaveBeenCalled()
  expect(tx.user.create).not.toHaveBeenCalled()
})

it('rejects an unverified email before accessing the database', async () => {
  await expect(linkKeycloakAccount({ ...input, emailVerified: false })).rejects.toThrow('verified email')
  expect(prisma.$transaction).not.toHaveBeenCalled()
})

it('rejects ambiguous legacy email matches', async () => {
  tx.user.findMany.mockResolvedValue([local, { ...local, id: 'duplicate' }])
  await expect(linkKeycloakAccount(input)).rejects.toThrow('Ambiguous')
  expect(tx.user.update).not.toHaveBeenCalled()
})

it('fails closed on a concurrent link or conflicting email rather than creating another user', async () => {
  tx.user.findMany.mockResolvedValue([local])
  tx.user.update.mockRejectedValue(Object.assign(new Error('Unique constraint'), { code: 'P2002' }))
  await expect(linkKeycloakAccount(input)).rejects.toMatchObject({ code: 'P2002' })
  expect(tx.user.create).not.toHaveBeenCalled()
})
