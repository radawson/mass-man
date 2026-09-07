import { effectiveBodyFatPercent } from '../body-fat'

const tapes = { neckCm: '38', waistCm: '86' }
const profile = { sex: 'MALE' as const, heightCm: '178', bodyFatSource: 'AUTO' as const }

describe('effective body fat', () => {
  it('AUTO uses device percent when present', () => {
    const result = effectiveBodyFatPercent(
      { ...tapes, bodyFatPercentDevice: '30.2' },
      profile,
    )
    expect(result.source).toBe('DEVICE')
    expect(result.value?.toString()).toBe('30.2')
  })

  it('AUTO falls back to Navy estimate', () => {
    const result = effectiveBodyFatPercent(tapes, profile)
    expect(result.source).toBe('ESTIMATED')
    expect(result.value).not.toBeNull()
  })

  it('DEVICE ignores estimate', () => {
    const result = effectiveBodyFatPercent(tapes, { ...profile, bodyFatSource: 'DEVICE' })
    expect(result.value).toBeNull()
    expect(result.source).toBeNull()
  })

  it('ESTIMATED ignores device percent', () => {
    const result = effectiveBodyFatPercent(
      { ...tapes, bodyFatPercentDevice: '30.2' },
      { ...profile, bodyFatSource: 'ESTIMATED' },
    )
    expect(result.source).toBe('ESTIMATED')
    expect(result.value?.toString()).not.toBe('30.2')
  })
})
