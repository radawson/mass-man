import { dailyAverages } from '../daily-averages'

const profile = {
  timeZone: 'America/New_York',
  sex: 'MALE' as const,
  heightCm: '178',
  bodyFatSource: 'AUTO' as const,
}

describe('daily averages', () => {
  it('uses a single reading as the day average', () => {
    const days = dailyAverages(
      [
        {
          id: 'a',
          recordedAt: new Date('2026-09-07T14:00:00.000Z'),
          weightKg: '80',
          bodyFatPercentDevice: '20',
        },
      ],
      profile,
    )
    expect(days).toHaveLength(1)
    expect(days[0].avgWeightKg?.toString()).toBe('80')
    expect(days[0].avgBodyFatPercent?.toString()).toBe('20')
    expect(days[0].count).toBe(1)
  })

  it('averages two readings on the same calendar day', () => {
    const days = dailyAverages(
      [
        {
          id: 'a',
          recordedAt: new Date('2026-09-07T12:00:00.000Z'),
          weightKg: '80',
        },
        {
          id: 'b',
          recordedAt: new Date('2026-09-07T20:00:00.000Z'),
          weightKg: '82',
        },
      ],
      profile,
    )
    expect(days).toHaveLength(1)
    expect(days[0].avgWeightKg?.toString()).toBe('81')
    expect(days[0].count).toBe(2)
  })

  it('uses the latest step count of the day', () => {
    const days = dailyAverages(
      [
        {
          id: 'a',
          recordedAt: new Date('2026-09-07T12:00:00.000Z'),
          weightKg: '80',
          steps: 4000,
        },
        {
          id: 'b',
          recordedAt: new Date('2026-09-07T22:00:00.000Z'),
          steps: 9120,
        },
      ],
      profile,
    )
    expect(days).toHaveLength(1)
    expect(days[0].steps).toBe(9120)
    expect(days[0].avgWeightKg?.toString()).toBe('80')
  })

  it('splits readings on either side of midnight in America/New_York', () => {
    const days = dailyAverages(
      [
        {
          id: 'late',
          recordedAt: new Date('2026-09-08T03:30:00.000Z'),
          weightKg: '80',
        },
        {
          id: 'early',
          recordedAt: new Date('2026-09-08T04:30:00.000Z'),
          weightKg: '82',
        },
      ],
      profile,
    )
    expect(days.map((day) => day.date).sort()).toEqual(['2026-09-07', '2026-09-08'])
  })
})
