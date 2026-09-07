import Decimal from 'decimal.js'

export const KG_PER_LB = new Decimal('0.45359237')
export const CM_PER_IN = new Decimal('2.54')

export type DecimalValue = Decimal.Value

export function d(value: DecimalValue): Decimal {
  return value instanceof Decimal ? value : new Decimal(value)
}

export function decimalToString(value: Decimal, dp?: number): string {
  return dp == null ? value.toString() : value.toFixed(dp)
}

export function mean(values: DecimalValue[]): Decimal | null {
  if (values.length === 0) return null
  const total = values.reduce<Decimal>((sum, value) => sum.plus(d(value)), new Decimal(0))
  return total.div(values.length)
}

export function kgToLb(kg: DecimalValue): Decimal {
  return d(kg).div(KG_PER_LB)
}

export function lbToKg(lb: DecimalValue): Decimal {
  return d(lb).times(KG_PER_LB)
}

export function cmToIn(cm: DecimalValue): Decimal {
  return d(cm).div(CM_PER_IN)
}

export function inToCm(inches: DecimalValue): Decimal {
  return d(inches).times(CM_PER_IN)
}
