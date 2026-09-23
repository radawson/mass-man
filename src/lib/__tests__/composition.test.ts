import { bmi, bmiCategory, fatMassKg, leanMassKg } from '../composition'

describe('composition', () => {
  it('computes BMI from kg and cm', () => {
    const value = bmi('80', '178')
    expect(value).not.toBeNull()
    expect(Number(value!.toFixed(1))).toBe(25.2)
    expect(bmiCategory(value!)).toBe('Overweight')
    expect(bmiCategory('22')).toBe('Normal')
    expect(bmiCategory('18')).toBe('Underweight')
    expect(bmiCategory('31')).toBe('Obese')
  })

  it('splits fat and lean mass from effective body fat', () => {
    expect(fatMassKg('80', '25').toString()).toBe('20')
    expect(leanMassKg('80', '25').toString()).toBe('60')
  })
})
