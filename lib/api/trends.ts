import { CheckInStatus, EnergyLevel, ItemType } from "@/types"

import { getUserTimeZone } from "@/lib/api/user-date"
import { db } from "@/lib/db"
import {
  addCalendarDays,
  createdAtCalendarDate,
  enumerateCalendarDates,
  formatDateInTimeZone,
} from "@/lib/domain/date"
import {
  countScheduledOpportunities,
  isScheduledDate,
} from "@/lib/domain/schedule"

export interface TrendDailyPoint {
  date: string
  dayOfWeek: number
  status?: CheckInStatus
  actualEnergy?: EnergyLevel
  actionText?: string
  actualAmount?: number
  completionRate?: number
  restReasonTag?: string
  notes?: string
  isScheduled: boolean
  isLogged: boolean
  isRest: boolean
  isCompleted: boolean
  isKept: boolean
  isLapsed: boolean
}

export interface TrendWeeklyPoint {
  weekLabel: string
  startDate: string
  endDate: string
  occurrenceCount: number | null
  lapseCount: number | null
  keptCount: number
  completedCount: number
  recordedDays: number
  scheduledDays: number
  unloggedDays: number
  isFullyObserved: boolean
  totalDaysInWeek: number
  completionRate: number | null
  totalActualAmount?: number
}

export interface ItemTrendData {
  itemId: string
  title: string
  whyPrompt?: string | null
  type: ItemType
  unitType?: string | null
  targetAmount?: number | null
  unitLabel?: string | null
  colorCode?: string | null
  rangeDays: number
  startDate: string
  endDate: string
  dailyPoints: TrendDailyPoint[]
  weeklyPoints: TrendWeeklyPoint[]
  summary: {
    totalDays: number
    scheduledOpportunities: number
    recordedDays: number
    unloggedScheduledDays: number
    fullyObservedZeroWeeks: number
    totalCompleted: number
    totalRestDays: number
    totalOccurrences: number
    totalLapses: number
    totalKeptDays: number
    completionRate: number
    observationRate: number
    totalOutputAmount?: number
  }
}

/** Aggregate an item's history without inventing failures before creation. */
export async function getItemTrendData(
  itemId: string,
  userId: string,
  rangeDays: number = 30
): Promise<ItemTrendData | null> {
  const item = await db.item.findFirst({ where: { id: itemId, userId } })
  if (!item || item.type === "TODO") return null

  const timeZone = await getUserTimeZone(userId)
  const endDateStr = formatDateInTimeZone(new Date(), timeZone)
  const requestedStart = addCalendarDays(endDateStr, -(rangeDays - 1))
  const createdDate = createdAtCalendarDate(item.createdAt, timeZone)
  const startDateStr =
    requestedStart > createdDate ? requestedStart : createdDate
  const dates = enumerateCalendarDates(startDateStr, endDateStr)

  const checkIns = await db.checkIn.findMany({
    where: { itemId, date: { gte: startDateStr, lte: endDateStr } },
    orderBy: { date: "asc" },
  })
  const checkInMap = new Map(checkIns.map((checkIn) => [checkIn.date, checkIn]))

  const dailyPoints: TrendDailyPoint[] = dates.map((date) => {
    const checkIn = checkInMap.get(date)
    return {
      date,
      dayOfWeek: new Date(`${date}T00:00:00.000Z`).getUTCDay(),
      status: checkIn?.status as CheckInStatus | undefined,
      actualEnergy: checkIn?.actualEnergy as EnergyLevel | undefined,
      actionText: checkIn?.actionText || undefined,
      actualAmount: checkIn?.actualAmount ?? undefined,
      completionRate:
        checkIn?.completionRate ??
        (checkIn?.status === "COMPLETED" ? 100 : undefined),
      restReasonTag: checkIn?.restReasonTag || undefined,
      notes: checkIn?.notes || undefined,
      isScheduled: item.type === "HABIT" ? isScheduledDate(date, item) : true,
      isLogged: Boolean(checkIn),
      isRest: checkIn?.status === "REST",
      isCompleted: checkIn?.status === "COMPLETED",
      isKept: checkIn?.status === "KEPT",
      isLapsed: checkIn?.status === "LAPSED",
    }
  })

  const weeklyPoints: TrendWeeklyPoint[] = []
  for (let index = 0; index < dailyPoints.length; index += 7) {
    const weekSlice = dailyPoints.slice(index, index + 7)
    if (!weekSlice.length) continue

    const scheduledDays =
      item.type === "HABIT"
        ? countScheduledOpportunities(
            weekSlice[0].date,
            weekSlice[weekSlice.length - 1].date,
            item
          )
        : weekSlice.length
    const recordedDays = weekSlice.filter((day) => day.isLogged).length
    const occurrenceCount = weekSlice.filter((day) => day.isLapsed).length
    const keptCount = weekSlice.filter((day) => day.isKept).length
    const completedCount = weekSlice.filter(
      (day) => day.isCompleted || day.isRest
    ).length
    const connectedCount =
      item.type === "QUIT_HABIT" ? keptCount : completedCount
    const totalActualAmount = weekSlice.reduce(
      (total, day) => total + (day.actualAmount || 0),
      0
    )
    const isFullyObserved = recordedDays >= scheduledDays

    weeklyPoints.push({
      weekLabel: `W${weeklyPoints.length + 1} (${weekSlice[0].date.slice(5)})`,
      startDate: weekSlice[0].date,
      endDate: weekSlice[weekSlice.length - 1].date,
      occurrenceCount: recordedDays ? occurrenceCount : null,
      lapseCount: recordedDays ? occurrenceCount : null,
      keptCount,
      completedCount,
      recordedDays,
      scheduledDays,
      unloggedDays: Math.max(0, scheduledDays - recordedDays),
      isFullyObserved,
      totalDaysInWeek: weekSlice.length,
      completionRate:
        scheduledDays > 0
          ? Math.min(100, Math.round((connectedCount / scheduledDays) * 100))
          : null,
      totalActualAmount,
    })
  }

  const totalCompleted = dailyPoints.filter((day) => day.isCompleted).length
  const totalRestDays = dailyPoints.filter((day) => day.isRest).length
  const totalOccurrences = dailyPoints.filter((day) => day.isLapsed).length
  const totalKeptDays = dailyPoints.filter((day) => day.isKept).length
  const recordedDays = dailyPoints.filter((day) => day.isLogged).length
  const totalOutputAmount = dailyPoints.reduce(
    (total, day) => total + (day.actualAmount || 0),
    0
  )
  const scheduledOpportunities =
    item.type === "HABIT"
      ? countScheduledOpportunities(startDateStr, endDateStr, item)
      : dates.length
  const positiveDays =
    item.type === "QUIT_HABIT"
      ? totalKeptDays
      : totalCompleted + totalRestDays

  return {
    itemId: item.id,
    title: item.title,
    whyPrompt: item.whyPrompt,
    type: item.type as ItemType,
    unitType: item.unitType,
    targetAmount: item.targetAmount,
    unitLabel: item.unitLabel,
    colorCode: item.colorCode,
    rangeDays,
    startDate: startDateStr,
    endDate: endDateStr,
    dailyPoints,
    weeklyPoints,
    summary: {
      totalDays: dates.length,
      scheduledOpportunities,
      recordedDays,
      unloggedScheduledDays: Math.max(0, scheduledOpportunities - recordedDays),
      fullyObservedZeroWeeks: weeklyPoints.filter(
        (week) => week.isFullyObserved && week.occurrenceCount === 0
      ).length,
      totalCompleted,
      totalRestDays,
      totalOccurrences,
      totalLapses: totalOccurrences,
      totalKeptDays,
      completionRate:
        scheduledOpportunities > 0
          ? Math.min(
              100,
              Math.round((positiveDays / scheduledOpportunities) * 100)
            )
          : 0,
      observationRate:
        scheduledOpportunities > 0
          ? Math.min(
              100,
              Math.round((recordedDays / scheduledOpportunities) * 100)
            )
          : 0,
      totalOutputAmount,
    },
  }
}
