import * as z from "zod"

export const userNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(32),
  timezone: z.string().max(64).optional(),
})
