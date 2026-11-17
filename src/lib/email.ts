export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Prisma's case-insensitive equals uses ILIKE, so email wildcards must be literal. */
export function emailFilter(email: string) {
  return { equals: normalizeEmail(email).replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' as const }
}
