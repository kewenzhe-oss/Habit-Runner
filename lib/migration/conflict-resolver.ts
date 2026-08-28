import { ItemWithDetails } from "@/types"

import {
  LocalCheckInRecord,
  LocalItemPayload,
  LocalItemRecord,
} from "./local-data"
import {
  MigrationAction,
  MigrationMergeInput,
  MigrationOperation,
} from "@/lib/validations/migration"

export interface ItemDifference {
  field: string
  fieldLabelZh: string
  fieldLabelEn: string
  cloudValue: any
  localValue: any
}

export interface ConflictItemAnalysis {
  localId: string
  status: "local_only" | "identical" | "conflict"
  localItem: LocalItemRecord
  cloudItem?: ItemWithDetails | null
  differences: ItemDifference[]
  selectedAction: MigrationAction
}

export interface MigrationPlan {
  totalLocalCount: number
  localOnlyCount: number
  identicalCount: number
  conflictCount: number
  analyses: ConflictItemAnalysis[]
}

const FIELD_LABELS: Record<string, { zh: string; en: string }> = {
  title: { zh: "事项名称", en: "Title" },
  type: { zh: "事项类型", en: "Item Type" },
  layer: { zh: "所属层级", en: "Layer" },
  targetAmount: { zh: "目标量", en: "Target Amount" },
  unitType: { zh: "单位类型", en: "Unit Type" },
  unitLabel: { zh: "单位标签", en: "Unit Label" },
  frequencyDays: { zh: "执行频次", en: "Frequency Days" },
  targetPerWeek: { zh: "每周目标天数", en: "Target Per Week" },
  whyPrompt: { zh: "初衷提示", en: "Why Prompt" },
  triggerCue: { zh: "触发情境", en: "Trigger Cue" },
  quitContext: { zh: "诱因情境", en: "Quit Context" },
  highRiskWindow: { zh: "高风险时段", en: "High Risk Window" },
  dueDate: { zh: "截止日期", en: "Due Date" },
  todoRecurrence: { zh: "重复周期", en: "Recurrence" },
}

function normalizeStr(val?: string | null): string {
  return (val || "").trim().toLowerCase()
}

/**
 * Compares scalar and string fields between cloud and local items.
 */
export function extractDifferences(
  local: LocalItemPayload,
  cloud: ItemWithDetails
): ItemDifference[] {
  const diffs: ItemDifference[] = []

  const checkField = (
    field: keyof typeof FIELD_LABELS,
    localVal: any,
    cloudVal: any
  ) => {
    const normLocal =
      typeof localVal === "string" ? normalizeStr(localVal) : localVal ?? null
    const normCloud =
      typeof cloudVal === "string" ? normalizeStr(cloudVal) : cloudVal ?? null

    if (normLocal !== normCloud) {
      diffs.push({
        field,
        fieldLabelZh: FIELD_LABELS[field]?.zh || field,
        fieldLabelEn: FIELD_LABELS[field]?.en || field,
        cloudValue: cloudVal ?? null,
        localValue: localVal ?? null,
      })
    }
  }

  // Check targetAmount
  if (local.type === "HABIT") {
    checkField("targetAmount", local.targetAmount, cloud.targetAmount)
    checkField("unitType", local.unitType, cloud.unitType)
    checkField("unitLabel", local.unitLabel, cloud.unitLabel)
    checkField("frequencyDays", local.frequencyDays, cloud.frequencyDays)
    checkField("targetPerWeek", local.targetPerWeek, cloud.targetPerWeek)
    checkField("triggerCue", local.triggerCue, cloud.triggerCue)
  } else if (local.type === "QUIT_HABIT") {
    checkField("quitContext", local.quitContext, cloud.quitContext)
    checkField("highRiskWindow", local.highRiskWindow, cloud.highRiskWindow)
  } else if (local.type === "TODO") {
    checkField("dueDate", local.dueDate, cloud.dueDate)
    checkField("todoRecurrence", local.todoRecurrence, cloud.todoRecurrence)
  }

  checkField("whyPrompt", local.whyPrompt, cloud.whyPrompt)
  checkField("layer", local.layer, cloud.layer)

  return diffs
}

/**
 * Analyzes all local items against existing cloud items to categorize
 * records into local_only, identical, and conflict.
 */
export function analyzeConflicts(
  localItems: LocalItemRecord[],
  cloudItems: ItemWithDetails[]
): MigrationPlan {
  const analyses: ConflictItemAnalysis[] = []

  let localOnlyCount = 0
  let identicalCount = 0
  let conflictCount = 0

  for (const localItem of localItems) {
    const normTitle = normalizeStr(localItem.payload.title)
    const match = cloudItems.find(
      (c) =>
        c.type === localItem.payload.type &&
        normalizeStr(c.title) === normTitle &&
        c.status !== "ARCHIVED"
    )

    if (!match) {
      localOnlyCount++
      analyses.push({
        localId: localItem.localId,
        status: "local_only",
        localItem,
        differences: [],
        selectedAction: "create",
      })
    } else {
      const differences = extractDifferences(localItem.payload, match)
      if (differences.length === 0) {
        identicalCount++
        analyses.push({
          localId: localItem.localId,
          status: "identical",
          localItem,
          cloudItem: match,
          differences: [],
          selectedAction: "skip",
        })
      } else {
        conflictCount++
        analyses.push({
          localId: localItem.localId,
          status: "conflict",
          localItem,
          cloudItem: match,
          differences,
          selectedAction: "keep_both", // Default to keep_both for safety
        })
      }
    }
  }

  return {
    totalLocalCount: localItems.length,
    localOnlyCount,
    identicalCount,
    conflictCount,
    analyses,
  }
}

/**
 * Updates resolution for a specific item analysis.
 */
export function updateItemResolution(
  plan: MigrationPlan,
  localId: string,
  action: MigrationAction
): MigrationPlan {
  return {
    ...plan,
    analyses: plan.analyses.map((analysis) => {
      if (analysis.localId === localId) {
        return {
          ...analysis,
          selectedAction: action,
        }
      }
      return analysis
    }),
  }
}

/**
 * Applies a batch resolution strategy across all conflict records.
 */
export function applyBatchResolution(
  plan: MigrationPlan,
  action: "keep_both" | "overwrite" | "keep_cloud"
): MigrationPlan {
  const targetAction: MigrationAction =
    action === "overwrite"
      ? "overwrite"
      : action === "keep_cloud"
        ? "skip"
        : "keep_both"

  return {
    ...plan,
    analyses: plan.analyses.map((analysis) => {
      if (analysis.status === "conflict") {
        return {
          ...analysis,
          selectedAction: targetAction,
        }
      }
      return analysis
    }),
  }
}

/**
 * Converts resolved analysis plan and check-ins into an executable backend merge payload.
 */
export function buildMergePayload(
  plan: MigrationPlan,
  checkIns: LocalCheckInRecord[] = []
): MigrationMergeInput {
  const operations: MigrationOperation[] = []

  for (const analysis of plan.analyses) {
    if (analysis.selectedAction === "skip") {
      continue
    }

    // Associate relevant check-ins if any match by item title
    const normTitle = normalizeStr(analysis.localItem.payload.title)
    const matchedCheckIns = checkIns
      .filter(
        (c) =>
          c.localItemId === analysis.localId ||
          (c.itemTitle && normalizeStr(c.itemTitle) === normTitle)
      )
      .map(({ localItemId, itemTitle, ...rest }) => rest)

    operations.push({
      localId: analysis.localId,
      action: analysis.selectedAction,
      targetCloudItemId: analysis.cloudItem?.id || null,
      itemData: {
        ...analysis.localItem.payload,
        layer: analysis.localItem.payload.layer || "LIFE",
      },
      checkIns: matchedCheckIns.length > 0 ? matchedCheckIns : undefined,
      customTitleSuffix:
        analysis.selectedAction === "keep_both" && analysis.status === "conflict"
          ? " (本地导入)"
          : undefined,
    })
  }

  return { operations }
}
