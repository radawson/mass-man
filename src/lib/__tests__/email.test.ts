import { normalizeEmail, emailFilter } from '../email'

it('normalizes whitespace and casing without changing literal email characters', () => {
  expect(normalizeEmail(' Person_Test@Example.Org ')).toBe('person_test@example.org')
})
it('matches underscores, percent signs and backslashes literally in PostgreSQL ILIKE', () => {
  expect(emailFilter(' Person_Test%\\name@Example.org ')).toEqual({
    equals: 'person\\_test\\%\\\\name@example.org', mode: 'insensitive',
  })
})
