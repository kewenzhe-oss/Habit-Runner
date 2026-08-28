import {
  CheckInStatus,
  EnergyLevel,
  TodayDashboardData,
  TodayItemDTO,
} from "@/types"

import { getUserItems } from "@/lib/api/items"
import { db } from "@/lib/db"
import { deriveHabitCheckIn, HabitCheckInInput } from "@/lib/domain/checkin"
import { addCalendarDays, getCalendarWeekDates } from "@/lib/domain/date"
import { isFlexibleSchedule, isScheduledDate } from "@/lib/domain/schedule"

/**
 * Calculates Action Streak and Rhythm Streak for an item
 */
export async function calculateItemStreaks(
  itemId: string,
  todayStr: string
): Promise<{
  actionStreak: number
  rhythmStreak: number
  longestActionStreak: number
  maintainedDays: number
}> {
  const item = await db.item.findUnique({
    where: { id: itemId },
    select: { createdAt: true, frequencyDays: true, targetPerWeek: true },
  })
  if (!item) {
    return {
      actionStreak: 0,
      rhythmStreak: 0,
      longestActionStreak: 0,
      maintainedDays: 0,
    }
  }

  const checkIns = await db.checkIn.findMany({
    where: {
      itemId,
      date: { lte: todayStr },
    },
    orderBy: { date: "desc" },
    take: 120, // look back 120 checkin days
  })

  if (checkIns.length === 0) {
    return {
      actionStreak: 0,
      rhythmStreak: 0,
      longestActionStreak: 0,
      maintainedDays: 0,
    }
  }

  // Map of date string to checkin
  const checkInMap = new Map<string, (typeof checkIns)[0]>()
  checkIns.forEach((c) => checkInMap.set(c.date, c))

  // Calculate Quit Habit maintained days
  let maintainedDays = 0
  const sortedDates = [...checkIns].sort((a, b) => b.date.localeCompare(a.date))
  for (const c of sortedDates) {
    if (c.status === "KEPT") {
      maintainedDays++
    } else if (c.status === "LAPSED") {
      break // current unbroken streak stops at first lapse
    }
  }

  // Flexible schedules are occurrence based: unplanned days do not create a false break.
  if (isFlexibleSchedule(item.frequencyDays)) {
    let actionStreak = 0
    let rhythmStreak = 0
    for (const checkIn of sortedDates) {
      if (checkIn.status === "COMPLETED" || checkIn.status === "KEPT") {
        actionStreak++
        rhythmStreak++
      } else if (checkIn.status === "REST") {
        rhythmStreak++
      } else {
        break
      }
    }
    return {
      actionStreak,
      rhythmStreak,
      longestActionStreak: actionStreak,
      maintainedDays,
    }
  }

  // Calculate Action Streak & Rhythm Streak on scheduled calendar days.
  let actionStreak = 0
  let rhythmStreak = 0
  let longestActionStreak = 0

  // Start from today or yesterday
  let checkDateStr = todayStr

  // If today has no record yet, start checking from yesterday so we don't prematurely report 0
  const todayRecord = checkInMap.get(todayStr)
  if (!todayRecord && isScheduledDate(todayStr, item)) {
    checkDateStr = addCalendarDays(checkDateStr, -1)
  }

  let streakActive = true
  let rhythmActive = true
  let tempLongest = 0
  let currentRun = 0

  // Check past 120 continuous days
  for (let i = 0; i < 120; i++) {
    const dStr = checkDateStr
    if (!isScheduledDate(dStr, item)) {
      checkDateStr = addCalendarDays(checkDateStr, -1)
      continue
    }
    const c = checkInMap.get(dStr)

    if (c) {
      if (c.status === "COMPLETED" || c.status === "KEPT") {
        if (streakActive) actionStreak++
        if (rhythmActive) rhythmStreak++
        currentRun++
        if (currentRun > longestActionStreak) longestActionStreak = currentRun
      } else if (c.status === "REST") {
        // Rest preserves Rhythm Streak, pauses Action Streak without resetting
        if (rhythmActive) rhythmStreak++
        currentRun = 0
      } else {
        // Lapsed / Skipped terminates current active streaks
        streakActive = false
        rhythmActive = false
        currentRun = 0
      }
    } else {
      // Missing day terminates active streaks
      streakActive = false
      rhythmActive = false
      currentRun = 0
    }

    checkDateStr = addCalendarDays(checkDateStr, -1)
  }

  return {
    actionStreak,
    rhythmStreak,
    longestActionStreak: Math.max(longestActionStreak, actionStreak),
    maintainedDays,
  }
}

/**
 * Record or update daily overall energy state
 */
export async function setDailyEnergyState(
  userId: string,
  date: string,
  energyLevel: EnergyLevel,
  note?: string
) {
  return await db.dailyEnergyState.upsert({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
    update: {
      energyLevel,
      note,
      updatedAt: new Date(),
    },
    create: {
      userId,
      date,
      energyLevel,
      note,
    },
  })
}

export const setDailyEnergy = setDailyEnergyState

/**
 * Record or update CheckIn for an item (Dual-writing structured metrics & text fields)
 */
export async function recordCheckIn(
  userId: string,
  itemId: string,
  date: string,
  data: {
    status: CheckInStatus
    plannedEnergy?: EnergyLevel
    actualEnergy?: EnergyLevel
    actionText?: string
    actualAmount?: number | null
    completionRate?: number | null
    restReasonTag?: string | null
    notes?: string
  }
) {
  // Verify item ownership
  const item = await db.item.findFirst({
    where: { id: itemId, userId },
  })

  if (!item) {
    throw new Error("Item not found or unauthorized")
  }

  return await db.checkIn.upsert({
    where: {
      itemId_date: {
        itemId,
        date,
      },
    },
    update: {
      status: data.status,
      plannedEnergy: data.plannedEnergy,
      actualEnergy: data.actualEnergy,
      actionText: data.actionText,
      actualAmount: data.actualAmount,
      completionRate: data.completionRate,
      restReasonTag: data.restReasonTag,
      notes: data.notes,
      updatedAt: new Date(),
    },
    create: {
      userId,
      itemId,
      date,
      status: data.status,
      plannedEnergy: data.plannedEnergy,
      actualEnergy: data.actualEnergy,
      actionText: data.actionText,
      actualAmount: data.actualAmount,
      completionRate: data.completionRate,
      restReasonTag: data.restReasonTag,
      notes: data.notes,
    },
  })
}

export async function recordHabitCheckIn(
  userId: string,
  itemId: string,
  date: string,
  input: HabitCheckInInput
) {
  const item = await db.item.findFirst({ where: { id: itemId, userId } })
  if (!item) throw new Error("Item not found or unauthorized")
  if (item.type !== "HABIT")
    throw new Error("Item type does not support habit check-ins")

  return recordCheckIn(userId, itemId, date, deriveHabitCheckIn(item, input))
}

export async function recordQuitStatus(
  userId: string,
  itemId: string,
  date: string,
  status: "KEPT" | "LAPSED",
  notes?: string
) {
  const item = await db.item.findFirst({ where: { id: itemId, userId } })
  if (!item) throw new Error("Item not found or unauthorized")
  if (item.type !== "QUIT_HABIT") {
    throw new Error("Item type does not support quit-habit check-ins")
  }
  return recordCheckIn(userId, itemId, date, { status, notes })
}

/**
 * Aggregates Today Dashboard data with dynamic action text
 */
export async function getTodayDashboardData(
  userId: string,
  dateStr: string
): Promise<TodayDashboardData> {
  // 1. Fetch user's daily energy state for today (optional)
  const dailyEnergyState = await db.dailyEnergyState.findUnique({
    where: {
      userId_date: {
        userId,
        date: dateStr,
      },
    },
  })

  const currentEnergy: EnergyLevel = dailyEnergyState?.energyLevel || "NORMAL"

  // 2. Fetch all active items for the user
  const allItems = await getUserItems(userId, {
    status: ["ACTIVE", "COMPLETED"],
  })

  // 3. Generate natural calendar week (Mon-Sun) containing dateStr
  const weekDates = getCalendarWeekDates(dateStr)
  const mondayStr = weekDates[0]
  const sundayStr = weekDates[6]

  // Fetch checkins for the natural week across all active items
  const recentCheckIns = await db.checkIn.findMany({
    where: {
      userId,
      date: { gte: mondayStr, lte: sundayStr },
      itemId: { in: allItems.map((i) => i.id) },
    },
  })

  const checkInMap = new Map<string, (typeof recentCheckIns)[0]>()
  const recentCheckInMap = new Map<string, (typeof recentCheckIns)[0]>()

  recentCheckIns.forEach((c) => {
    recentCheckInMap.set(`${c.itemId}_${c.date}`, c)
    if (c.date === dateStr) {
      checkInMap.set(c.itemId, c)
    }
  })

  const items = allItems.filter(
    (item) =>
      item.status === "ACTIVE" ||
      (item.type === "TODO" &&
        item.status === "COMPLETED" &&
        checkInMap.get(item.id)?.status === "COMPLETED")
  )

  // 4. Map to TodayItemDTO with dynamic action text matching current energy
  const itemDTOs: TodayItemDTO[] = await Promise.all(
    items.map(async (item) => {
      const checkIn = checkInMap.get(item.id)

      // Find preset for current energy
      const matchingPreset = item.actionPresets.find(
        (p) => p.energyLevel === currentEnergy
      )
      const normalPreset = item.actionPresets.find(
        (p) => p.energyLevel === "NORMAL"
      )

      const recommendedAction =
        matchingPreset?.actionText || normalPreset?.actionText || item.title

      // Find recommended tool
      const matchingTool =
        item.toolLinks.find((t) => t.energyLevel === currentEnergy) ||
        item.toolLinks.find((t) => !t.energyLevel) ||
        item.toolLinks[0] ||
        null

      // Calculate streak metrics
      const streaks = await calculateItemStreaks(item.id, dateStr)

      // Map natural calendar week (Mon-Sun) trace
      const recent7Days = weekDates.map((d, idx) => {
        const c = recentCheckInMap.get(`${item.id}_${d}`)
        const isToday = d === dateStr
        const isFuture = d > dateStr
        return {
          date: d,
          dayOfWeek: idx + 1, // 1 is Mon, 7 is Sun
          status: (c?.status as CheckInStatus) || null,
          actualEnergy: (c?.actualEnergy as EnergyLevel) || null,
          isScheduled: isScheduledDate(d, item),
          isToday,
          isFuture,
        }
      })

      return {
        id: item.id,
        title: item.title,
        whyPrompt: item.whyPrompt,
        type: item.type,
        layer: item.layer,
        customCategory: item.category?.name || item.customCategory || null,
        status: item.status,
        colorCode: item.colorCode,
        dueDate: item.dueDate,
        unitType: item.unitType || null,
        targetAmount: item.targetAmount || null,
        unitLabel: item.unitLabel || null,
        recommendedAction,
        actionPresets: item.actionPresets,
        recommendedTool: matchingTool,
        toolLinks: item.toolLinks,
        todayCheckIn: checkIn
          ? {
              id: checkIn.id,
              status: checkIn.status as CheckInStatus,
              actualEnergy: checkIn.actualEnergy as EnergyLevel,
              actionText: checkIn.actionText,
              actualAmount: checkIn.actualAmount || null,
              completionRate: checkIn.completionRate || null,
              restReasonTag: checkIn.restReasonTag || null,
              notes: checkIn.notes,
            }
          : null,
        actionStreak: streaks.actionStreak,
        rhythmStreak: streaks.rhythmStreak,
        maintainedDays: streaks.maintainedDays,
        recent7Days,
      }
    })
  )

  // 5. Compute summary stats
  const totalActiveHabits = itemDTOs.filter((i) => i.type === "HABIT").length
  const totalActiveQuits = itemDTOs.filter(
    (i) => i.type === "QUIT_HABIT"
  ).length
  const totalPendingTodos = itemDTOs.filter(
    (i) =>
      i.type === "TODO" &&
      (!i.todayCheckIn || i.todayCheckIn.status !== "COMPLETED")
  ).length

  const completedTodayCount = itemDTOs.filter(
    (i) =>
      i.todayCheckIn &&
      (i.todayCheckIn.status === "COMPLETED" ||
        i.todayCheckIn.status === "KEPT")
  ).length

  const restTodayCount = itemDTOs.filter(
    (i) => i.todayCheckIn && i.todayCheckIn.status === "REST"
  ).length

  return {
    date: dateStr,
    dailyEnergy: dailyEnergyState?.energyLevel || null,
    dailyEnergyNote: dailyEnergyState?.note,
    items: itemDTOs,
    stats: {
      totalActiveHabits,
      totalActiveQuits,
      totalPendingTodos,
      completedTodayCount,
      restTodayCount,
    },
  }
}
