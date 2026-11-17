import { prisma } from './prisma'
import { normalizeEmail, emailFilter } from './email'
import type { Role } from '@/generated/prisma/client'

export async function linkKeycloakAccount(input: {
  subject: string
  email: string
  emailVerified: boolean
  name: string
  role: Role
}) {
  if (!input.subject || !input.emailVerified) throw new Error('Keycloak requires a verified email')
  const email = normalizeEmail(input.email)
  if (!email) throw new Error('Keycloak email is missing')

  return prisma.$transaction(async (tx) => {
    let existing = await tx.user.findUnique({ where: { keycloakSubject: input.subject } })
    if (!existing) {
      // Before explicit subject linking, SSO-only accounts used the subject as their ID.
      const legacy = await tx.user.findUnique({ where: { id: input.subject } })
      if (legacy?.isKeycloakUser && !legacy.keycloakSubject) existing = legacy
    }
    if (!existing) {
      const matches = await tx.user.findMany({
        where: { email: emailFilter(email) },
        take: 2,
      })
      if (matches.length > 1) throw new Error('Ambiguous account email')
      existing = matches[0] ?? null
    }
    if (existing) {
      if (!existing.isActive) throw new Error('Account is inactive')
      if (existing.keycloakSubject && existing.keycloakSubject !== input.subject) {
        throw new Error('Account is already linked to another Keycloak identity')
      }
      return tx.user.update({
        where: {
          id: existing.id,
          isActive: true,
          OR: [{ keycloakSubject: null }, { keycloakSubject: input.subject }],
        },
        data: {
          keycloakSubject: input.subject,
          email,
          role: input.role,
          isKeycloakUser: true,
          password: null,
        },
      })
    }
    return tx.user.create({
      data: {
        email,
        name: input.name || 'User',
        role: input.role,
        keycloakSubject: input.subject,
        isKeycloakUser: true,
      },
    })
  })
}
