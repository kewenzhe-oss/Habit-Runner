import type { ItemPriority, Layer } from "@/types"

import type { PendingNewItemPayload } from "@/lib/pending-new-item"

export type QuickAddItemType = "HABIT" | "QUIT_HABIT" | "TODO"
export type QuickAddUnitType = "TIME" | "COUNT" | "BINARY"
export type QuickAddFrequency = "DAILY" | "WEEKDAYS" | "3_4_TIMES" | "WEEKENDS"

export type QuickAddFormState = {
  priority: ItemPriority
  locale?: "zh" | "en"
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
    priority: state.priority,
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

  const zh = state.locale !== "en"
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
      state.unitLabel.trim() ||
      (state.unitType === "TIME"
        ? zh
          ? "分钟"
          : "minutes"
        : zh
          ? "个"
          : "items")
    const effectiveTarget =
      state.unitType === "BINARY" ? null : Number(state.targetAmount) || 1
    const unitMeta = JSON.stringify({
      unitType: state.unitType,
      targetAmount: effectiveTarget,
      unitLabel: effectiveUnitLabel,
    })
    const triggerPrefix = state.triggerCue.trim()
      ? zh
        ? `[触发：${state.triggerCue.trim()}] `
        : `[Cue: ${state.triggerCue.trim()}] `
      : ""
    const highTarget =
      state.unitType === "BINARY"
        ? zh
          ? "深度完成"
          : "A deeper session"
        : `${Math.round((state.targetAmount || 20) * 1.2)} ${effectiveUnitLabel}`
    const normalTarget =
      state.unitType === "BINARY"
        ? zh
          ? "标准完成"
          : "Completed"
        : `${state.targetAmount || 20} ${effectiveUnitLabel}`
    const lowTarget =
      state.unitType === "BINARY"
        ? zh
          ? "3分钟微行动"
          : "A small step"
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
        actionText: `${triggerPrefix}${zh ? "充沛推进" : "More energy"}：${state.title.trim()} (${highTarget})`,
        description: unitMeta,
      },
      {
        energyLevel: "NORMAL",
        actionText: `${triggerPrefix}${zh ? "标准执行" : "Regular pace"}：${state.title.trim()} (${normalTarget})`,
        description: unitMeta,
      },
      {
        energyLevel: "LOW",
        actionText: `${zh ? "微小连接" : "Small step"}：${state.title.trim()} (${lowTarget})`,
        description: unitMeta,
      },
      {
        energyLevel: "REST",
        actionText: zh ? "有意识休整恢复与蓄能" : "Rest and recharge",
        description: unitMeta,
      },
    ]
  } else if (state.type === "QUIT_HABIT") {
    const contextDescription = state.contextTags.trim()
      ? `${zh ? "情境诱因" : "Trigger"}：${state.contextTags.trim()}`
      : ""
    const windowDescription = state.highRiskWindow.trim()
      ? `${zh ? "高风险时段" : "High-risk time"}：${state.highRiskWindow.trim()}`
      : ""

    payload.quitContext = state.contextTags.trim() || null
    payload.highRiskWindow = state.highRiskWindow.trim() || null
    payload.actionPresets = [
      {
        energyLevel: "HIGH",
        actionText: zh
          ? "全天平稳自律，无冲动发生"
          : "Notice and manage urges throughout the day",
      },
      {
        energyLevel: "NORMAL",
        actionText: windowDescription
          ? `${zh ? "重点注意" : "Pay attention to"} ${windowDescription}`
          : zh
            ? "识别诱因并主动远离"
            : "Notice triggers and step away",
      },
      {
        energyLevel: "LOW",
        actionText: contextDescription
          ? zh
            ? `在 ${contextDescription} 中保持觉察与停顿`
            : `Pause and notice: ${contextDescription}`
          : zh
            ? "觉察当下冲动，深呼吸暂停"
            : "Notice the urge, breathe and pause",
      },
      {
        energyLevel: "REST",
        actionText: zh ? "身心放松与主动减压" : "Take time to relax and unwind",
      },
    ]
  } else {
    payload.dueDate = state.dueDate || undefined
    payload.todoRecurrence = state.todoRecurring
  }

  if (state.toolUrl.trim()) {
    payload.toolLinks = [
      {
        title: zh ? "打开关联工具" : "Open linked tool",
        url: state.toolUrl.trim(),
      },
    ]
  }

  return payload
}
