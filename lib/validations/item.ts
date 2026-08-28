import * as z from "zod"

export const layerEnum = z.enum([
  "BODY",
  "CRAFT",
  "SIGNAL",
  "MEMORY",
  "JUDGMENT",
  "CONTEMPLATION",
  "LIFE",
])

export const itemTypeEnum = z.enum(["HABIT", "QUIT_HABIT", "TODO"])

export const energyLevelEnum = z.enum(["HIGH", "NORMAL", "LOW", "REST"])

export const unitTypeEnum = z.enum(["TIME", "COUNT", "BINARY"])

export const toolLinkSchema = z.object({
  title: z.string().min(1, "Tool title is required").max(32),
  url: z
    .string()
    .url("Must be a valid URL")
    .refine((val) => val.startsWith("https://"), {
      message: "Only secure HTTPS URLs are allowed",
    }),
  energyLevel: z.enum(["HIGH", "NORMAL", "LOW", "REST", "ANY"]).optional(),
  description: z.string().max(128).optional(),
})

export const actionPresetSchema = z.object({
  energyLevel: energyLevelEnum,
  actionText: z.string().min(1, "Action description is required").max(256),
  description: z.string().max(1024).optional().nullable(),
})

export const itemCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(64),
  whyPrompt: z.string().max(256).optional(),
  type: itemTypeEnum,
  layer: layerEnum.optional().default("LIFE"),
  customCategory: z.string().max(32).optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  colorCode: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Must be a valid hex color code")
    .optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD")
    .optional()
    .nullable(),
  unitType: unitTypeEnum.optional().nullable(),
  targetAmount: z
    .number()
    .finite()
    .positive()
    .max(1_000_000)
    .optional()
    .nullable(),
  unitLabel: z.string().max(32).optional().nullable(),
  frequencyDays: z.string().optional().nullable(), // e.g. "0,1,2,3,4,5,6"
  targetPerWeek: z.number().int().min(1).max(7).optional().nullable(),
  triggerCue: z.string().max(128).optional().nullable(),
  quitContext: z.string().max(256).optional().nullable(),
  highRiskWindow: z.string().max(128).optional().nullable(),
  todoRecurrence: z.enum(["ONCE", "WEEKLY", "MONTHLY"]).optional().nullable(),
  actionPresets: z.array(actionPresetSchema).optional(),
  toolLinks: z
    .array(toolLinkSchema)
    .max(3, "Max 3 tool links allowed")
    .optional(),
})

export const itemUpdateSchema = itemCreateSchema.partial().extend({
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
})
