import { navyBodyFatPercent } from '../navy-body-fat'

describe('US Navy body fat', () => {
  it('estimates male body fat from height, neck, and waist', () => {
    const result = navyBodyFatPercent({
      sex: 'MALE',
      heightCm: '178',
      neckCm: '38',
      waistCm: '86',
    })
    expect(result).not.toBeNull()
    expect(Number(result!.toFixed(1))).toBeGreaterThan(10)
    expect(Number(result!.toFixed(1))).toBeLessThan(25)
  })

  it('estimates female body fat from height, neck, waist, and hips', () => {
    const result = navyBodyFatPercent({
      sex: 'FEMALE',
      heightCm: '165',
      neckCm: '32',
      waistCm: '74',
      hipsCm: '96',
    })
    expect(result).not.toBeNull()
    expect(Number(result!.toFixed(1))).toBeGreaterThan(15)
    expect(Number(result!.toFixed(1))).toBeLessThan(35)
  })

  it('returns null for female without hips', () => {
    expect(
      navyBodyFatPercent({
        sex: 'FEMALE',
        heightCm: '165',
        neckCm: '32',
        waistCm: '74',
      }),
    ).toBeNull()
  })
})
