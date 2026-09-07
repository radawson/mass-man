import Decimal from 'decimal.js'
import { navyBodyFatPercent, Sex } from './navy-body-fat'
import { DecimalValue } from './units'

export type BodyFatSource = 'DEVICE' | 'ESTIMATED' | 'AUTO'

export type BodyFatInputs = {
  bodyFatPercentDevice?: DecimalValue | null
  neckCm?: DecimalValue | null
  waistCm?: DecimalValue | null
  hipsCm?: DecimalValue | null
}

export function estimatedBodyFatPercent(
  inputs: BodyFatInputs,
  profile: { sex?: Sex | null; heightCm?: DecimalValue | null },
): Decimal | null {
  if (!profile.sex || profile.heightCm == null || inputs.neckCm == null || inputs.waistCm == null) {
    return null
  }
  return navyBodyFatPercent({
    sex: profile.sex,
    heightCm: profile.heightCm,
    neckCm: inputs.neckCm,
    waistCm: inputs.waistCm,
    hipsCm: inputs.hipsCm,
  })
}

export function effectiveBodyFatPercent(
  inputs: BodyFatInputs,
  profile: { sex?: Sex | null; heightCm?: DecimalValue | null; bodyFatSource: BodyFatSource },
): { value: Decimal | null; source: 'DEVICE' | 'ESTIMATED' | null } {
  const device =
    inputs.bodyFatPercentDevice == null ? null : new Decimal(inputs.bodyFatPercentDevice)
  const estimated = estimatedBodyFatPercent(inputs, profile)

  switch (profile.bodyFatSource) {
    case 'DEVICE':
      return { value: device, source: device ? 'DEVICE' : null }
    case 'ESTIMATED':
      return { value: estimated, source: estimated ? 'ESTIMATED' : null }
    case 'AUTO':
    default:
      if (device) return { value: device, source: 'DEVICE' }
      if (estimated) return { value: estimated, source: 'ESTIMATED' }
      return { value: null, source: null }
  }
}
