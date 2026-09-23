import { format } from 'date-fns'
import { tz } from '@date-fns/tz'

export function ageInYears(dateOfBirth: Date, timeZone: string, now = new Date()): number {
  const birth = {
    y: dateOfBirth.getUTCFullYear(),
    m: dateOfBirth.getUTCMonth() + 1,
    d: dateOfBirth.getUTCDate(),
  }
  const [y, m, d] = format(now, 'yyyy-MM-dd', { in: tz(timeZone) }).split('-').map(Number)
  let age = y - birth.y
  if (m < birth.m || (m === birth.m && d < birth.d)) age -= 1
  return age
}
