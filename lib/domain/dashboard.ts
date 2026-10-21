import type { EnergyLevel, TodayItemDTO } from "@/types"

export type DashboardItemPatch = Partial<TodayItemDTO> | null
export type MutateDashboardItem = (
  item: TodayItemDTO,
  optimistic: DashboardItemPatch,
  save: () => Promise<DashboardItemPatch>
) => Promise<void>

export function isTodoCompleted(item: TodayItemDTO) {
  return (
    item.status === "COMPLETED" ||
    ((item.todoRecurrence === "WEEKLY" || item.todoRecurrence === "MONTHLY") &&
      item.todayCheckIn?.status === "COMPLETED")
  )
}

export function recommendForEnergy(
  item: TodayItemDTO,
  energy: EnergyLevel
): TodayItemDTO {
  const preset =
    item.actionPresets.find((p) => p.energyLevel === energy) ||
    item.actionPresets.find((p) => p.energyLevel === "NORMAL")
  return {
    ...item,
    recommendedAction: preset?.actionText || item.title,
    recommendedTool:
      item.toolLinks.find((t) => t.energyLevel === energy) ||
      item.toolLinks.find((t) => !t.energyLevel) ||
      item.toolLinks[0] ||
      null,
  }
}

export function checkInPatch(
  item: TodayItemDTO,
  date: string | undefined,
  checkIn: NonNullable<TodayItemDTO["todayCheckIn"]>,
  streaks?: Partial<
    Pick<TodayItemDTO, "actionStreak" | "rhythmStreak" | "maintainedDays">
  >
): DashboardItemPatch {
  return {
    todayCheckIn: checkIn,
    recent7Days: item.recent7Days?.map((day) =>
      day.date === date
        ? { ...day, status: checkIn.status, actualEnergy: checkIn.actualEnergy }
        : day
    ),
    ...streaks,
  }
}
