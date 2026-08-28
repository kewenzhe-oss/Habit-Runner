import * as z from "zod"

import {
  energyLevelEnum,
  itemCreateSchema,
  itemTypeEnum,
  layerEnum,
} from "./item"

export const migrationActionEnum = z.enum([
  "create",
  "overwrite",
  "keep_both",
  "skip",
])

export const localCheckInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  status: z.enum(["COMPLETED", "KEPT", "LAPSED", "REST", "SKIPPED"]),
  plannedEnergy: energyLevelEnum.optional().nullable(),
  actualEnergy: energyLevelEnum.optional().nullable(),
  actionText: z.string().max(256).optional().nullable(),
  actualAmount: z.number().optional().nullable(),
  notes: z.string().max(1024).optional().nullable(),
})

export const migrationOperationSchema = z.object({
  localId: z.string().optional(),
  action: migrationActionEnum,
  targetCloudItemId: z.string().optional().nullable(),
  itemData: itemCreateSchema,
  checkIns: z.array(localCheckInSchema).optional(),
  customTitleSuffix: z.string().max(32).optional(),
})

export const migrationMergeSchema = z.object({
  operations: z.array(migrationOperationSchema),
})

export type MigrationAction = z.infer<typeof migrationActionEnum>
export type LocalCheckInInput = z.infer<typeof localCheckInSchema>
export type MigrationOperation = z.infer<typeof migrationOperationSchema>
export type MigrationMergeInput = z.infer<typeof migrationMergeSchema>
