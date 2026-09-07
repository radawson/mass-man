import { UnitSystem } from '@/generated/prisma/client'
import { cmToIn, d, DecimalValue, inToCm, kgToLb, lbToKg } from './units'

export function weightToCanonical(value: string, unit: UnitSystem): string {
  return unit === UnitSystem.IMPERIAL ? lbToKg(value).toString() : d(value).toString()
}

export function lengthToCanonical(value: string, unit: UnitSystem): string {
  return unit === UnitSystem.IMPERIAL ? inToCm(value).toString() : d(value).toString()
}

export function weightFromCanonical(kg: DecimalValue, unit: UnitSystem, dp = 1): string {
  return unit === UnitSystem.IMPERIAL ? kgToLb(kg).toFixed(dp) : d(kg).toFixed(dp)
}

export function lengthFromCanonical(cm: DecimalValue, unit: UnitSystem, dp = 1): string {
  return unit === UnitSystem.IMPERIAL ? cmToIn(cm).toFixed(dp) : d(cm).toFixed(dp)
}

export function optionalLengthToCanonical(
  value: string | number | null | undefined,
  unit: UnitSystem,
): string | null {
  if (value == null || value === '') return null
  return lengthToCanonical(String(value), unit)
}

export function optionalDecimalString(value: unknown): string | null {
  if (value == null || value === '') return null
  return String(value)
}
