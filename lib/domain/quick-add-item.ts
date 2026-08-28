import type { Layer } from "@/types"

import type { PendingNewItemPayload } from "@/lib/pending-new-item"

export type QuickAddItemType = "HABIT" | "QUIT_HABIT" | "TODO"
export type QuickAddUnitType = "TIME" | "COUNT" | "BINARY"
export type QuickAddFrequency = "DAILY" | "WEEKDAYS" | "3_4_TIMES" | "WEEKENDS"

export type QuickAddFormState = {
  title: string
  whyPrompt: string
  type: QuickAddItemType
  layer: Layer
  finalCategory: string
  categoryId?: string
  unitType: QuickAddUnitType
  targetAmount: number
  unitLabel: string
  targetFrequency: QuickAddFrequency
  triggerCue: string
  contextTags: string
  highRiskWindow: string
  dueDate: string
  todoRecurring: "ONCE" | "WEEKLY" | "MONTHLY"
  toolUrl: string
}

export function buildQuickAddItemPayload(
  state: QuickAddFormState
): PendingNewItemPayload {
  const payload: PendingNewItemPayload = {
    title: state.title.trim(),
    whyPrompt: state.whyPrompt.trim() || undefined,
    type: state.type,
    layer: state.layer,
    customCategory: state.finalCategory,
    categoryId: state.categoryId,
    colorCode:
      state.type === "QUIT_HABIT"
        ? "#EA580C"
        : state.type === "TODO"
          ? "#2563EB"
          : "#10B981",
  }

  if (state.type === "HABIT") {
    const frequencyMap: Record<
      QuickAddFrequency,
      { days: string; target: number }
    > = {
      DAILY: { days: "0,1,2,3,4,5,6", target: 7 },
      WEEKDAYS: { days: "1,2,3,4,5", target: 5 },
      "3_4_TIMES": { days: "3_4_DAYS", target: 4 },
      WEEKENDS: { days: "0,6", target: 2 },
    }
    const frequency = frequencyMap[state.targetFrequency]
    const effectiveUnitLabel =
      state.unitLabel.trim() || (state.unitType === "TIME" ? "分钟" : "个")
    const effectiveTarget =
      state.unitType === "BINARY" ? null : Number(state.targetAmount) || 1
    const unitMeta = JSON.stringify({
      unitType: state.unitType,
      targetAmount: effectiveTarget,
      unitLabel: effectiveUnitLabel,
    })
    const triggerPrefix = state.triggerCue.trim()
      ? `[触发：${state.triggerCue.trim()}] `
      : ""
    const highTarget =
      state.unitType === "BINARY"
        ? "深度完成"
        : `${Math.round((state.targetAmount || 20) * 1.2)} ${effectiveUnitLabel}`
    const normalTarget =
      state.unitType === "BINARY"
        ? "标准完成"
        : `${state.targetAmount || 20} ${effectiveUnitLabel}`
    const lowTarget =
      state.unitType === "BINARY"
        ? "3分钟微行动"
        : `${Math.max(1, Math.round((state.targetAmount || 20) * 0.3))} ${effectiveUnitLabel}`

    payload.frequencyDays = frequency.days
    payload.targetPerWeek = frequency.target
    payload.triggerCue = state.triggerCue.trim() || null
    payload.unitType = state.unitType
    payload.targetAmount = effectiveTarget
    payload.unitLabel = state.unitType === "BINARY" ? null : effectiveUnitLabel
    payload.actionPresets = [
      {
        energyLevel: "HIGH",
        actionText: `${triggerPrefix}充沛推进：${state.title.trim()} (${highTarget})`,
        description: unitMeta,
      },
      {
        energyLevel: "NORMAL",
        actionText: `${triggerPrefix}标准执行：${state.title.trim()} (${normalTarget})`,
        description: unitMeta,
      },
      {
        energyLevel: "LOW",
        actionText: `微小连接：${state.title.trim()} (${lowTarget})`,
        description: unitMeta,
      },
      {
        energyLevel: "REST",
        actionText: "有意识休整恢复与蓄能",
        description: unitMeta,
      },
    ]
  } else if (state.type === "QUIT_HABIT") {
    const contextDescription = state.contextTags.trim()
      ? `情境诱因：${state.contextTags.trim()}`
      : ""
    const windowDescription = state.highRiskWindow.trim()
      ? `高风险时段：${state.highRiskWindow.trim()}`
      : ""

    payload.quitContext = state.contextTags.trim() || null
    payload.highRiskWindow = state.highRiskWindow.trim() || null
    payload.actionPresets = [
      { energyLevel: "HIGH", actionText: "全天平稳自律，无冲动发生" },
      {
        energyLevel: "NORMAL",
        actionText: windowDescription
          ? `重点注意 ${windowDescription}`
          : "识别诱因并主动远离",
      },
      {
        energyLevel: "LOW",
        actionText: contextDescription
          ? `在 ${contextDescription} 中保持觉察与停顿`
          : "觉察当下冲动，深呼吸暂停",
      },
      { energyLevel: "REST", actionText: "身心放松与主动减压" },
    ]
  } else {
    payload.dueDate = state.dueDate || undefined
    payload.todoRecurrence = state.todoRecurring
  }

  if (state.toolUrl.trim()) {
    payload.toolLinks = [{ title: "打开关联工具", url: state.toolUrl.trim() }]
  }

  return payload
}
