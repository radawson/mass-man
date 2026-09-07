import {
  BodyFatSource,
  Goal,
  Measurement,
  Sex,
  UnitSystem,
  User,
} from '@/generated/prisma/client'
import { effectiveBodyFatPercent, estimatedBodyFatPercent } from './body-fat'
import { bmi, fatMassKg, leanMassKg } from './composition'
import { lengthFromCanonical, weightFromCanonical } from './serialize'
import { decimalToString } from './units'

function n(value: { toString(): string } | null | undefined): string | null {
  return value == null ? null : value.toString()
}

export type UserProfile = Pick<User, 'sex' | 'heightCm' | 'bodyFatSource' | 'displayUnit' | 'timeZone'>

export function presentMeasurement(row: Measurement, user: UserProfile) {
  const unit = user.displayUnit
  const tapes = {
    neckCm: n(row.neckCm),
    waistCm: n(row.waistCm),
    hipsCm: n(row.hipsCm),
    bodyFatPercentDevice: n(row.bodyFatPercentDevice),
  }
  const profile = {
    sex: user.sex,
    heightCm: n(user.heightCm),
    bodyFatSource: user.bodyFatSource,
  }
  const estimated = estimatedBodyFatPercent(tapes, profile)
  const effective = effectiveBodyFatPercent(tapes, profile)

  return {
    id: row.id,
    recordedAt: row.recordedAt.toISOString(),
    note: row.note,
    weightKg: row.weightKg.toString(),
    weightDisplay: weightFromCanonical(row.weightKg.toString(), unit),
    bodyFatPercentDevice: n(row.bodyFatPercentDevice),
    bodyFatPercentEstimated: estimated ? decimalToString(estimated, 2) : null,
    bodyFatPercentEffective: effective.value ? decimalToString(effective.value, 2) : null,
    bodyFatSourceUsed: effective.source,
    neck: row.neckCm ? lengthFromCanonical(row.neckCm.toString(), unit) : null,
    shoulders: row.shouldersCm ? lengthFromCanonical(row.shouldersCm.toString(), unit) : null,
    chest: row.chestCm ? lengthFromCanonical(row.chestCm.toString(), unit) : null,
    waist: row.waistCm ? lengthFromCanonical(row.waistCm.toString(), unit) : null,
    hips: row.hipsCm ? lengthFromCanonical(row.hipsCm.toString(), unit) : null,
    leftUpperArm: row.leftUpperArmCm ? lengthFromCanonical(row.leftUpperArmCm.toString(), unit) : null,
    rightUpperArm: row.rightUpperArmCm ? lengthFromCanonical(row.rightUpperArmCm.toString(), unit) : null,
    leftThigh: row.leftThighCm ? lengthFromCanonical(row.leftThighCm.toString(), unit) : null,
    rightThigh: row.rightThighCm ? lengthFromCanonical(row.rightThighCm.toString(), unit) : null,
    leftCalf: row.leftCalfCm ? lengthFromCanonical(row.leftCalfCm.toString(), unit) : null,
    rightCalf: row.rightCalfCm ? lengthFromCanonical(row.rightCalfCm.toString(), unit) : null,
  }
}

export function presentUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    displayUnit: user.displayUnit,
    theme: user.theme,
    timeZone: user.timeZone,
    heightCm: n(user.heightCm),
    heightDisplay: user.heightCm
      ? lengthFromCanonical(user.heightCm.toString(), user.displayUnit)
      : null,
    sex: user.sex,
    bodyFatSource: user.bodyFatSource,
    unitLabels: unitLabels(user.displayUnit),
  }
}

export function unitLabels(unit: UnitSystem) {
  return unit === UnitSystem.IMPERIAL
    ? { weight: 'lb', length: 'in', system: 'lb / in' }
    : { weight: 'kg', length: 'cm', system: 'kg / cm' }
}

export function toAverageInput(row: Measurement) {
  return {
    id: row.id,
    recordedAt: row.recordedAt,
    weightKg: row.weightKg.toString(),
    bodyFatPercentDevice: n(row.bodyFatPercentDevice),
    neckCm: n(row.neckCm),
    waistCm: n(row.waistCm),
    hipsCm: n(row.hipsCm),
    chestCm: n(row.chestCm),
    leftUpperArmCm: n(row.leftUpperArmCm),
    rightUpperArmCm: n(row.rightUpperArmCm),
    leftThighCm: n(row.leftThighCm),
    rightThighCm: n(row.rightThighCm),
    leftCalfCm: n(row.leftCalfCm),
    rightCalfCm: n(row.rightCalfCm),
  }
}

export function averageProfile(user: User) {
  return {
    timeZone: user.timeZone,
    sex: user.sex as Sex | null,
    heightCm: n(user.heightCm),
    bodyFatSource: user.bodyFatSource as BodyFatSource,
  }
}

export function presentDailyAverage(
  day: ReturnType<typeof import('./daily-averages').dailyAverages>[number],
  unit: UnitSystem,
) {
  return {
    date: day.date,
    count: day.count,
    measurementIds: day.measurementIds,
    avgWeight: day.avgWeightKg ? weightFromCanonical(day.avgWeightKg, unit) : null,
    avgWeightKg: day.avgWeightKg?.toString() ?? null,
    avgBodyFatPercent: day.avgBodyFatPercent ? day.avgBodyFatPercent.toFixed(2) : null,
    avgWaist: day.avgWaistCm ? lengthFromCanonical(day.avgWaistCm, unit) : null,
    avgChest: day.avgChestCm ? lengthFromCanonical(day.avgChestCm, unit) : null,
    avgHips: day.avgHipsCm ? lengthFromCanonical(day.avgHipsCm, unit) : null,
    avgUpperArm: day.avgUpperArmCm ? lengthFromCanonical(day.avgUpperArmCm, unit) : null,
    avgThigh: day.avgThighCm ? lengthFromCanonical(day.avgThighCm, unit) : null,
    avgNeck: day.avgNeckCm ? lengthFromCanonical(day.avgNeckCm, unit) : null,
  }
}

export function compositionFor(weightKg: string, bf: string | null, heightCm: string | null) {
  return {
    bmi: heightCm ? bmi(weightKg, heightCm)?.toFixed(1) ?? null : null,
    fatMassKg: bf ? fatMassKg(weightKg, bf).toFixed(1) : null,
    leanMassKg: bf ? leanMassKg(weightKg, bf).toFixed(1) : null,
  }
}

export type { Goal }
