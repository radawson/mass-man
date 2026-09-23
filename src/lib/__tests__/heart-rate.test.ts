import { heartRateZones, maxHeartRate } from '../heart-rate'

describe('heart rate zones', () => {
  it('uses 220 minus age and the four training bands', () => {
    expect(maxHeartRate(40)).toBe(180)
    const zones = heartRateZones(40)
    expect(zones.map((zone) => [zone.label, zone.low, zone.high])).toEqual([
      ['Fat-burning', 90, 108],
      ['Weight control', 108, 126],
      ['Aerobic', 126, 144],
      ['Anaerobic', 144, 162],
    ])
  })
})
