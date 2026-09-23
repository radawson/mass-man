import { ageInYears } from '../age'

describe('age', () => {
  it('counts whole years in the user time zone', () => {
    const birth = new Date('1990-09-23T00:00:00.000Z')
    const before = new Date('2026-09-22T16:00:00.000Z')
    const onDay = new Date('2026-09-23T16:00:00.000Z')
    expect(ageInYears(birth, 'America/New_York', before)).toBe(35)
    expect(ageInYears(birth, 'America/New_York', onDay)).toBe(36)
  })
})
