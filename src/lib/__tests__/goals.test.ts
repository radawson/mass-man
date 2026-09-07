import { goalProgress, milestoneTarget } from '../goals'

describe('goal progress', () => {
  it('computes decrease progress and the 50% milestone', () => {
    const halfway = milestoneTarget('72.3', '66.0', '0.5')
    expect(halfway.toFixed(2)).toBe('69.15')

    const result = goalProgress('72.3', '66.7', '66.0', 'DECREASE')
    expect(Number(result.progressPercent.toFixed(0))).toBe(89)
    expect(result.status).toBe('Almost there')
    expect(result.milestoneReached['50']).toBe(true)
    expect(result.milestoneReached['100']).toBe(false)
  })
})
