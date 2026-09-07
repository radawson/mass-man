import { kgToLb, lbToKg, cmToIn, inToCm, mean } from '../units'

describe('unit conversion', () => {
  it('round-trips kilograms and pounds', () => {
    const kg = lbToKg('180')
    const back = kgToLb(kg)
    expect(back.toFixed(10)).toBe('180.0000000000')
  })

  it('round-trips centimeters and inches', () => {
    const cm = inToCm('32')
    const back = cmToIn(cm)
    expect(back.toFixed(10)).toBe('32.0000000000')
  })

  it('averages one or many values', () => {
    expect(mean(['80'])?.toString()).toBe('80')
    expect(mean(['80', '82'])?.toString()).toBe('81')
    expect(mean([])).toBeNull()
  })
})
