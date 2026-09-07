import Decimal from 'decimal.js'
import { d, DecimalValue } from './units'

export function bmi(weightKg: DecimalValue, heightCm: DecimalValue): Decimal | null {
  const heightM = d(heightCm).div(100)
  if (heightM.lte(0)) return null
  return d(weightKg).div(heightM.pow(2))
}

export function fatMassKg(weightKg: DecimalValue, bodyFatPercent: DecimalValue): Decimal {
  return d(weightKg).times(d(bodyFatPercent).div(100))
}

export function leanMassKg(weightKg: DecimalValue, bodyFatPercent: DecimalValue): Decimal {
  return d(weightKg).minus(fatMassKg(weightKg, bodyFatPercent))
}

export function bilateralAverage(
  left?: DecimalValue | null,
  right?: DecimalValue | null,
): Decimal | null {
  if (left != null && right != null) return d(left).plus(d(right)).div(2)
  if (left != null) return d(left)
  if (right != null) return d(right)
  return null
}
