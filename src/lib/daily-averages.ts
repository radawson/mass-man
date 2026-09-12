import { format } from 'date-fns'
import { tz } from '@date-fns/tz'
import Decimal from 'decimal.js'
import { BodyFatInputs, BodyFatSource, effectiveBodyFatPercent } from './body-fat'
import { Sex } from './navy-body-fat'
import { bilateralAverage } from './composition'
import { d, DecimalValue, mean } from './units'

export type MeasurementForAverage = BodyFatInputs & {
  id: string
  recordedAt: Date
  weightKg?: DecimalValue | null
  steps?: number | null
  chestCm?: DecimalValue | null
  hipsCm?: DecimalValue | null
  leftUpperArmCm?: DecimalValue | null
  rightUpperArmCm?: DecimalValue | null
  leftThighCm?: DecimalValue | null
  rightThighCm?: DecimalValue | null
  leftCalfCm?: DecimalValue | null
  rightCalfCm?: DecimalValue | null
}

export type UserProfileForAverage = {
  timeZone: string
  sex?: Sex | null
  heightCm?: DecimalValue | null
  bodyFatSource: BodyFatSource
}

export type DailyAverage = {
  date: string
  count: number
  measurementIds: string[]
  avgWeightKg: Decimal | null
  avgBodyFatPercent: Decimal | null
  avgWaistCm: Decimal | null
  avgChestCm: Decimal | null
  avgHipsCm: Decimal | null
  avgUpperArmCm: Decimal | null
  avgThighCm: Decimal | null
  avgNeckCm: Decimal | null
  steps: number | null
}

export function calendarDayKey(date: Date, timeZone: string): string {
  return format(date, 'yyyy-MM-dd', { in: tz(timeZone) })
}

function latestSteps(rows: MeasurementForAverage[]): number | null {
  const withSteps = rows
    .filter((row) => row.steps != null)
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
  const last = withSteps.at(-1)
  return last?.steps ?? null
}

function collect(values: Array<DecimalValue | null | undefined>): Decimal[] {
  return values.filter((v): v is DecimalValue => v != null).map((v) => d(v))
}

export function dailyAverages(
  measurements: MeasurementForAverage[],
  profile: UserProfileForAverage,
): DailyAverage[] {
  const buckets = new Map<string, MeasurementForAverage[]>()

  for (const measurement of measurements) {
    const key = calendarDayKey(measurement.recordedAt, profile.timeZone)
    const list = buckets.get(key) ?? []
    list.push(measurement)
    buckets.set(key, list)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => {
      const effectiveBf = rows
        .map((row) => effectiveBodyFatPercent(row, profile).value)
        .filter((v): v is Decimal => v != null)

      return {
        date,
        count: rows.length,
        measurementIds: rows.map((row) => row.id),
        avgWeightKg: mean(collect(rows.map((row) => row.weightKg))),
        avgBodyFatPercent: mean(effectiveBf),
        avgWaistCm: mean(collect(rows.map((row) => row.waistCm))),
        avgChestCm: mean(collect(rows.map((row) => row.chestCm))),
        avgHipsCm: mean(collect(rows.map((row) => row.hipsCm))),
        avgNeckCm: mean(collect(rows.map((row) => row.neckCm))),
        avgUpperArmCm: mean(
          collect(
            rows.map((row) => bilateralAverage(row.leftUpperArmCm, row.rightUpperArmCm)),
          ),
        ),
        avgThighCm: mean(
          collect(rows.map((row) => bilateralAverage(row.leftThighCm, row.rightThighCm))),
        ),
        steps: latestSteps(rows),
      }
    })
}
