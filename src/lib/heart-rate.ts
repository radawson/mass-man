export type HeartRateZone = {
  id: 'fat' | 'weight' | 'aerobic' | 'anaerobic'
  label: string
  lowPercent: number
  highPercent: number
  low: number
  high: number
}

const bands = [
  { id: 'fat', label: 'Fat-burning', lowPercent: 50, highPercent: 60 },
  { id: 'weight', label: 'Weight control', lowPercent: 60, highPercent: 70 },
  { id: 'aerobic', label: 'Aerobic', lowPercent: 70, highPercent: 80 },
  { id: 'anaerobic', label: 'Anaerobic', lowPercent: 80, highPercent: 90 },
] as const

export function maxHeartRate(age: number): number {
  return 220 - age
}

export function heartRateZones(age: number): HeartRateZone[] {
  const max = maxHeartRate(age)
  return bands.map((band) => ({
    ...band,
    low: Math.round((max * band.lowPercent) / 100),
    high: Math.round((max * band.highPercent) / 100),
  }))
}

export function zoneBoundsAtAge(age: number): { low: number; high: number } {
  const max = maxHeartRate(age)
  return { low: Math.round(max * 0.5), high: Math.round(max * 0.9) }
}
