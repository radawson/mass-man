import {
  collectKeycloakRoles,
  decodeJwtPayload,
  mapKeycloakRolesToAppRole,
} from '../keycloak-roles'

function encodeJwt(payload: Record<string, unknown>): string {
  const json = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `header.${json}.signature`
}

describe('decodeJwtPayload', () => {
  it('decodes a JWT payload', () => {
    const token = encodeJwt({ sub: 'user-1', email: 'a@b.c' })
    expect(decodeJwtPayload(token)).toEqual({ sub: 'user-1', email: 'a@b.c' })
  })

  it('returns null for malformed tokens', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull()
  })
})

describe('collectKeycloakRoles', () => {
  it('reads client roles from resource_access', () => {
    const roles = collectKeycloakRoles(
      [{ resource_access: { 'ptx-mass-man': { roles: ['ADMIN'] } } }],
      'ptx-mass-man',
    )
    expect(roles).toEqual(['admin'])
  })
})

describe('mapKeycloakRolesToAppRole', () => {
  it('maps admin aliases to ADMIN', () => {
    expect(mapKeycloakRolesToAppRole(['it_admin'])).toBe('ADMIN')
  })
  it('maps guest', () => {
    expect(mapKeycloakRolesToAppRole(['guest'])).toBe('GUEST')
  })
  it('defaults to USER', () => {
    expect(mapKeycloakRolesToAppRole(['something'])).toBe('USER')
  })
})
