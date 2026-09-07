import Decimal from 'decimal.js'
import { d, DecimalValue } from './units'

export type GoalDirection = 'DECREASE' | 'INCREASE' | 'MAINTAIN'

export type GoalProgress = {
  remaining: Decimal
  progressPercent: Decimal
  status: string
  milestoneReached: Record<'25' | '50' | '75' | '100', boolean>
  milestoneTargets: Record<'25' | '50' | '75' | '100', Decimal>
}

const MAINTAIN_BAND = new Decimal('0.02')

function clampPercent(value: Decimal): Decimal {
  if (value.lt(0)) return new Decimal(0)
  if (value.gt(100)) return new Decimal(100)
  return value
}

function statusFromProgress(percent: Decimal): string {
  if (percent.gte(100)) return 'Complete'
  if (percent.gte(75)) return 'Almost there'
  if (percent.gte(50)) return 'On track'
  if (percent.gte(25)) return 'On track'
  return 'Just started'
}

export function milestoneTarget(
  start: DecimalValue,
  target: DecimalValue,
  fraction: DecimalValue,
): Decimal {
  return d(start).plus(d(target).minus(d(start)).times(d(fraction)))
}

export function goalProgress(
  start: DecimalValue,
  current: DecimalValue,
  target: DecimalValue,
  direction: GoalDirection,
): GoalProgress {
  const startD = d(start)
  const currentD = d(current)
  const targetD = d(target)
  const remaining = currentD.minus(targetD)

  const fractions = {
    '25': new Decimal('0.25'),
    '50': new Decimal('0.5'),
    '75': new Decimal('0.75'),
    '100': new Decimal('1'),
  } as const

  const milestoneTargets = {
    '25': milestoneTarget(startD, targetD, fractions['25']),
    '50': milestoneTarget(startD, targetD, fractions['50']),
    '75': milestoneTarget(startD, targetD, fractions['75']),
    '100': milestoneTarget(startD, targetD, fractions['100']),
  }

  if (direction === 'MAINTAIN') {
    const band = targetD.abs().times(MAINTAIN_BAND)
    const distance = currentD.minus(targetD).abs()
    const onTrack = distance.lte(band.eq(0) ? new Decimal('0.5') : band)
    const progressPercent = onTrack ? new Decimal(100) : new Decimal(0)
    return {
      remaining,
      progressPercent,
      status: onTrack ? 'On track' : 'Off track',
      milestoneReached: {
        '25': onTrack,
        '50': onTrack,
        '75': onTrack,
        '100': onTrack,
      },
      milestoneTargets,
    }
  }

  const span = direction === 'DECREASE' ? startD.minus(targetD) : targetD.minus(startD)
  const done = direction === 'DECREASE' ? startD.minus(currentD) : currentD.minus(startD)
  const progressPercent = span.eq(0) ? new Decimal(100) : clampPercent(done.div(span).times(100))

  const reached = (fraction: Decimal) => {
    if (direction === 'DECREASE') {
      return currentD.lte(milestoneTarget(startD, targetD, fraction))
    }
    return currentD.gte(milestoneTarget(startD, targetD, fraction))
  }

  return {
    remaining,
    progressPercent,
    status: statusFromProgress(progressPercent),
    milestoneReached: {
      '25': reached(fractions['25']),
      '50': reached(fractions['50']),
      '75': reached(fractions['75']),
      '100': reached(fractions['100']),
    },
    milestoneTargets,
  }
}

export function overallProgress(percents: Decimal[]): Decimal | null {
  if (percents.length === 0) return null
  return percents.reduce((sum, value) => sum.plus(value), new Decimal(0)).div(percents.length)
}

export function overallStatus(percent: Decimal | null): string {
  if (percent == null) return 'No goals'
  if (percent.gte(100)) return 'COMPLETE'
  if (percent.gte(50)) return 'ON TRACK'
  if (percent.gte(25)) return 'ON TRACK'
  return 'JUST STARTED'
}
