import { z } from 'zod'

export const decimalString = z.union([z.string(), z.number()]).transform((v) => String(v))

export const optionalDecimal = z
  .union([z.string(), z.number(), z.null(), z.literal('')])
  .optional()
  .transform((v) => (v === undefined ? undefined : v == null || v === '' ? null : String(v)))

export const positiveDecimal = decimalString.refine(
  (v) => !Number.isNaN(Number(v)) && Number(v) > 0,
  { message: 'Must be a positive number' },
)
