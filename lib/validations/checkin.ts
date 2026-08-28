import * as z from "zod"

export const dailyEnergySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  energyLevel: z.enum(["HIGH", "NORMAL", "LOW", "REST"]),
  note: z.string().max(200).optional(),
})

export const checkInCreateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  actualAmount: z.number().finite().min(0).max(1_000_000).optional().nullable(),
  restReasonTag: z.string().max(128).optional().nullable(),
  notes: z.string().max(500).optional(),
})

export const quitStatusSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  status: z.enum(["KEPT", "LAPSED"]),
  notes: z.string().max(500).optional(),
})

export const todoStatusSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  actualEnergy: z.enum(["HIGH", "NORMAL", "LOW"]).optional(),
  notes: z.string().max(500).optional(),
})
