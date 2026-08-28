import type { EnergyLevel } from "@/types"

export type HabitUnitType = "TIME" | "COUNT" | "BINARY"

export type HabitMetricConfig = {
  title: string
  unitType?: string | null
  targetAmount?: number | null
  unitLabel?: string | null
}

export type HabitCheckInInput = {
  actualAmount?: number | null
  restReasonTag?: string | null
  notes?: string
}

export type DerivedHabitCheckIn = {
  status: "COMPLETED" | "REST"
  actualEnergy: EnergyLevel
  actionText: string
  actualAmount: number
  completionRate: number
  restReasonTag: string | null
  notes?: string
}

export function normalizeUnitType(unitType?: string | null): HabitUnitType {
  return unitType === "TIME" || unitType === "COUNT" || unitType === "BINARY"
    ? unitType
    : "BINARY"
}

export function deriveHabitCheckIn(
  item: HabitMetricConfig,
  input: HabitCheckInInput
): DerivedHabitCheckIn {
  const unitType = normalizeUnitType(item.unitType)
  const targetAmount =
    typeof item.targetAmount === "number" && item.targetAmount > 0
      ? item.targetAmount
      : 1
  const rawAmount =
    input.actualAmount ?? (unitType === "BINARY" ? 1 : targetAmount)

  if (!Number.isFinite(rawAmount) || rawAmount < 0 || rawAmount > 1_000_000) {
    throw new Error(
      "Actual amount must be a finite number between 0 and 1,000,000"
    )
  }

  const actualAmount =
    unitType === "BINARY" ? (rawAmount > 0 ? 1 : 0) : rawAmount
  const completionRate =
    actualAmount === 0 ? 0 : Math.round((actualAmount / targetAmount) * 100)

  let actualEnergy: EnergyLevel
  if (actualAmount === 0) actualEnergy = "REST"
  else if (unitType === "BINARY") actualEnergy = "NORMAL"
  else if (completionRate >= 120) actualEnergy = "HIGH"
  else if (completionRate >= 80) actualEnergy = "NORMAL"
  else actualEnergy = "LOW"

  const isRest = actualEnergy === "REST"
  const restReasonTag = isRest
    ? input.restReasonTag?.trim() || "有意识休整恢复"
    : null
  const unitLabel =
    item.unitLabel?.trim() || (unitType === "TIME" ? "分钟" : "次")
  const actionText = isRest
    ? `今日休整：${restReasonTag}`
    : unitType === "BINARY"
      ? `已完成：${item.title}`
      : `完成 ${actualAmount} ${unitLabel} (${completionRate}% ${actualEnergy})`

  return {
    status: isRest ? "REST" : "COMPLETED",
    actualEnergy,
    actionText,
    actualAmount,
    completionRate,
    restReasonTag,
    notes: input.notes?.trim() || undefined,
  }
}
