import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccount } from '@/lib/session'
import { dailyAverages } from '@/lib/daily-averages'
import { goalProgress, overallProgress, overallStatus } from '@/lib/goals'
import {
  averageProfile,
  compositionFor,
  presentDailyAverage,
  presentUser,
  toAverageInput,
  unitLabels,
} from '@/lib/present'
import { lengthFromCanonical, weightFromCanonical } from '@/lib/serialize'
import { GoalMetric, UnitSystem } from '@/generated/prisma/client'
import Decimal from 'decimal.js'

function currentForMetric(
  metric: GoalMetric,
  latest: ReturnType<typeof presentDailyAverage> | undefined,
) {
  if (!latest) return null
  switch (metric) {
    case GoalMetric.WEIGHT:
      return latest.avgWeight
    case GoalMetric.BODY_FAT:
      return latest.avgBodyFatPercent
    case GoalMetric.WAIST:
      return latest.avgWaist
    case GoalMetric.CHEST:
      return latest.avgChest
    case GoalMetric.HIPS:
      return latest.avgHips
    case GoalMetric.UPPER_ARM:
      return latest.avgUpperArm
    case GoalMetric.THIGH:
      return latest.avgThigh
    default:
      return null
  }
}

function displayGoalValue(metric: GoalMetric, canonical: string, unit: UnitSystem) {
  if (metric === GoalMetric.WEIGHT) return weightFromCanonical(canonical, unit)
  if (metric === GoalMetric.BODY_FAT) return new Decimal(canonical).toFixed(1)
  return lengthFromCanonical(canonical, unit)
}

export async function GET() {
  const { account, error } = await requireAccount()
  if (error) return error

  const [rows, goals] = await Promise.all([
    prisma.measurement.findMany({
      where: { userId: account.id },
      orderBy: { recordedAt: 'asc' },
    }),
    prisma.goal.findMany({ where: { userId: account.id } }),
  ])

  const days = dailyAverages(rows.map(toAverageInput), averageProfile(account))
  const presentedDays = days.map((day) => presentDailyAverage(day, account.displayUnit))
  const latest = presentedDays.at(-1)
  const first = presentedDays[0]
  const chartDays = presentedDays.slice(-90)

  const weightGoal = goals.find((g) => g.metric === GoalMetric.WEIGHT)
  const startWeight = weightGoal
    ? weightFromCanonical(weightGoal.startValue.toString(), account.displayUnit)
    : first?.avgWeight ?? null

  const heightCm = account.heightCm?.toString() ?? null
  const composition = latest?.avgWeightKg
    ? compositionFor(latest.avgWeightKg, latest.avgBodyFatPercent, heightCm)
    : { bmi: null, fatMassKg: null, leanMassKg: null }

  const leanDisplay = composition.leanMassKg
    ? weightFromCanonical(composition.leanMassKg, account.displayUnit)
    : null

  const goalViews = goals.map((goal) => {
    const current = currentForMetric(goal.metric, latest)
    const start = displayGoalValue(goal.metric, goal.startValue.toString(), account.displayUnit)
    const target = displayGoalValue(goal.metric, goal.targetValue.toString(), account.displayUnit)
    const progress = current
      ? goalProgress(start, current, target, goal.direction)
      : null
    return {
      id: goal.id,
      metric: goal.metric,
      direction: goal.direction,
      start,
      current,
      target,
      remaining: progress?.remaining.toFixed(1) ?? null,
      progressPercent: progress ? Number(progress.progressPercent.toFixed(0)) : null,
      status: progress?.status ?? 'No data',
      milestoneReached: progress?.milestoneReached ?? null,
      milestoneTargets: progress
        ? {
            '25': progress.milestoneTargets['25'].toFixed(1),
            '50': progress.milestoneTargets['50'].toFixed(1),
            '75': progress.milestoneTargets['75'].toFixed(1),
            '100': progress.milestoneTargets['100'].toFixed(1),
          }
        : null,
      milestoneNotes: (goal.milestoneNotes as Record<string, string> | null) ?? {},
      startDate: goal.startDate.toISOString(),
    }
  })

  const percents = goalViews
    .map((g) => g.progressPercent)
    .filter((v): v is number => v != null)
    .map((v) => new Decimal(v))
  const overall = overallProgress(percents)

  const comparisonMetrics: GoalMetric[] = [
    GoalMetric.WEIGHT,
    GoalMetric.BODY_FAT,
    GoalMetric.WAIST,
    GoalMetric.CHEST,
    GoalMetric.HIPS,
  ]

  const comparison = comparisonMetrics.map((metric) => {
    const goal = goalViews.find((g) => g.metric === metric)
    const start = goal?.start ?? (metric === GoalMetric.WEIGHT ? first?.avgWeight : null)
    const current = currentForMetric(metric, latest)
    const change =
      start && current ? new Decimal(current).minus(start).toFixed(1) : null
    const direction = goal?.direction ?? 'DECREASE'
    const improved =
      change == null
        ? null
        : direction === 'INCREASE'
          ? new Decimal(change).gt(0)
          : new Decimal(change).lt(0)
    return {
      metric,
      start,
      current,
      change,
      improved,
    }
  })

  return NextResponse.json({
    user: presentUser(account),
    units: unitLabels(account.displayUnit),
    kpis: {
      currentWeight: latest?.avgWeight ?? null,
      weightChange:
        startWeight && latest?.avgWeight
          ? new Decimal(latest.avgWeight).minus(startWeight).toFixed(1)
          : null,
      bodyFatPercent: latest?.avgBodyFatPercent ?? null,
      steps:
        [...presentedDays].reverse().find((day) => day.steps != null)?.steps ?? null,
      waist: latest?.avgWaist ?? null,
      unitSystem: unitLabels(account.displayUnit).system,
      bmi: composition.bmi,
      leanMass: leanDisplay,
      overallProgress: overall ? Number(overall.toFixed(0)) : null,
      measurementDays: presentedDays.length,
      goalStatus: overallStatus(overall),
    },
    chart: chartDays.map((day) => ({
      date: day.date,
      weight: day.avgWeight,
      bodyFat: day.avgBodyFatPercent,
      steps: day.steps,
    })),
    stepsGoal: account.stepsGoal ?? 10000,
    comparison,
    goals: goalViews,
    latestDate: latest?.date ?? null,
  })
}
