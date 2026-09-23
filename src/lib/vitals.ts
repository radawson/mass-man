import { UnitSystem } from '@/generated/prisma/client'
import { temperatureToCanonical } from './serialize'

export function storedTemperature(value: string | null | undefined, unit: UnitSystem) {
  if (value == null) return value
  const celsius = temperatureToCanonical(value, unit)
  const n = Number(celsius)
  if (!Number.isFinite(n) || n < 30 || n > 45) {
    throw new RangeError('Temperature is out of range')
  }
  return celsius
}
