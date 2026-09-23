import { z } from 'zod'

export const decimalString = z.union([z.string(), z.number()]).transform((v) => String(v))

export const optionalDecimal = z
  .union([z.string(), z.number(), z.null(), z.literal('')])
  .optional()
  .transform((v) => (v === undefined ? undefined : v == null || v === '' ? null : String(v)))

export const optionalSteps = z
  .union([z.string(), z.number(), z.null(), z.literal('')])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined
    if (v == null || v === '') return null
    return Number(v)
  })
  .refine(
    (v) => v === undefined || v === null || (Number.isInteger(v) && v >= 0 && v <= 250000),
    { message: 'Steps must be a whole number between 0 and 250000' },
  )

function optionalWholeNumber(min: number, max: number, message: string) {
  return z
    .union([z.string(), z.number(), z.null(), z.literal('')])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined
      if (v == null || v === '') return null
      return Number(v)
    })
    .refine((v) => v === undefined || v === null || (Number.isInteger(v) && v >= min && v <= max), {
      message,
    })
}

export const optionalHeartRate = optionalWholeNumber(30, 250, 'Heart rate must be a whole number from 30 to 250')
export const optionalSystolic = optionalWholeNumber(70, 250, 'Systolic pressure must be a whole number from 70 to 250')
export const optionalDiastolic = optionalWholeNumber(40, 200, 'Diastolic pressure must be a whole number from 40 to 200')

export const positiveDecimal = decimalString.refine(
  (v) => !Number.isNaN(Number(v)) && Number(v) > 0,
  { message: 'Must be a positive number' },
)
