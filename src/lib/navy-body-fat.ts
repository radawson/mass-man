import Decimal from 'decimal.js'
import { CM_PER_IN, d, DecimalValue } from './units'

export type Sex = 'MALE' | 'FEMALE'

export function navyBodyFatPercent(params: {
  sex: Sex
  heightCm: DecimalValue
  neckCm: DecimalValue
  waistCm: DecimalValue
  hipsCm?: DecimalValue | null
}): Decimal | null {
  const heightIn = d(params.heightCm).div(CM_PER_IN)
  const neckIn = d(params.neckCm).div(CM_PER_IN)
  const waistIn = d(params.waistCm).div(CM_PER_IN)

  if (heightIn.lte(0) || neckIn.lte(0) || waistIn.lte(0)) return null

  let result: Decimal

  if (params.sex === 'MALE') {
    const waistMinusNeck = waistIn.minus(neckIn)
    if (waistMinusNeck.lte(0)) return null
    result = new Decimal('86.010')
      .times(waistMinusNeck.log(10))
      .minus(new Decimal('70.041').times(heightIn.log(10)))
      .plus('36.76')
  } else {
    if (params.hipsCm == null) return null
    const hipsIn = d(params.hipsCm).div(CM_PER_IN)
    if (hipsIn.lte(0)) return null
    const sum = waistIn.plus(hipsIn).minus(neckIn)
    if (sum.lte(0)) return null
    result = new Decimal('163.205')
      .times(sum.log(10))
      .minus(new Decimal('97.684').times(heightIn.log(10)))
      .minus('78.387')
  }

  if (!result.isFinite() || result.lte(0) || result.gte(75)) return null
  return result
}
