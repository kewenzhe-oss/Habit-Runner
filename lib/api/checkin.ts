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
  todayStr: string,
  preloaded?: {
    item?: {
      createdAt: Date
      frequencyDays?: string | null
      targetPerWeek?: number | null
    }
    checkIns?: Array<{ date: string; status: string }>
  }
): Promise<{
  actionStreak: number
  rhythmStreak: number
  longestActionStreak: number
  maintainedDays: number
}> {
  const item = preloaded?.item
    ? preloaded.item
    : await db.item.findUnique({
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

  const checkIns = preloaded?.checkIns
    ? preloaded.checkIns
    : await db.checkIn.findMany({
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
export async function setDailyEnergy(
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

/**
 * Record or update CheckIn for an item (Dual-writing structured metrics & text fields)
 */
async function recordCheckIn(
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
    nextIntent?: string
  }
) {
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
      nextIntent: data.nextIntent,
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
      nextIntent: data.nextIntent,
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

  const checkIn = await recordCheckIn(
    userId,
    itemId,
    date,
    deriveHabitCheckIn(item, input)
  )
  // The write has succeeded. Optional display metrics must not turn a saved
  // record into a failed response if the follow-up read is unavailable.
  const streaks = await calculateItemStreaks(itemId, date, { item }).catch(
    () => undefined
  )
  return { ...checkIn, streaks }
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
  const checkIn = await recordCheckIn(userId, itemId, date, { status, notes })
  const streaks = await calculateItemStreaks(itemId, date, { item }).catch(
    () => undefined
  )
  return { ...checkIn, streaks }
}

/**
 * Aggregates Today Dashboard data with dynamic action text
 */
export async function getTodayDashboardData(
  userId: string,
  dateStr: string
): Promise<TodayDashboardData> {
  const weekDates = getCalendarWeekDates(dateStr)
  const mondayStr = weekDates[0]
  const sundayStr = weekDates[6]
  const yesterdayStr = addCalendarDays(dateStr, -1)
  const earliestLookbackDate = addCalendarDays(dateStr, -120)

  // These reads have no dependency on each other. Keep long-history rows
  // narrow, and combine the week + yesterday reads into a single round trip.
  const [dailyEnergyState, allItems, windowCheckIns, batchCheckIns120] =
    await Promise.all([
      db.dailyEnergyState.findUnique({
        where: { userId_date: { userId, date: dateStr } },
      }),
      getUserItems(userId, {
        status: ["ACTIVE", "COMPLETED"],
        includeCheckInCount: false,
      }),
      db.checkIn.findMany({
        where: {
          userId,
          item: { status: { in: ["ACTIVE", "COMPLETED"] } },
          OR: [
            { date: { gte: mondayStr, lte: sundayStr } },
            { date: yesterdayStr, nextIntent: { not: null } },
          ],
        },
      }),
      db.checkIn.findMany({
        where: {
          userId,
          item: { status: { in: ["ACTIVE", "COMPLETED"] } },
          date: { gte: earliestLookbackDate, lte: dateStr },
        },
        select: { itemId: true, date: true, status: true },
        orderBy: { date: "desc" },
      }),
    ])

  const currentEnergy: EnergyLevel = dailyEnergyState?.energyLevel || "NORMAL"
  const recentCheckIns = windowCheckIns.filter(
    (c) => c.date >= mondayStr && c.date <= sundayStr
  )

  const checkInMap = new Map<string, (typeof recentCheckIns)[0]>()
  const recentCheckInMap = new Map<string, (typeof recentCheckIns)[0]>()

  recentCheckIns.forEach((c) => {
    recentCheckInMap.set(`${c.itemId}_${c.date}`, c)
    if (c.date === dateStr) {
      checkInMap.set(c.itemId, c)
    }
  })

  const yesterdayCheckIns = windowCheckIns.filter(
    (c) => c.date === yesterdayStr && c.nextIntent
  )
  const nextIntentMap = new Map<string, string>()
  yesterdayCheckIns.forEach((c) => {
    if (c.nextIntent) nextIntentMap.set(c.itemId, c.nextIntent)
  })

  // For completed TODOs, retain those completed within the current natural week or today.
  // Older completed items are archived to keep the dashboard focused.
  const completedThisWeekItemIds = new Set(
    recentCheckIns.filter((c) => c.status === "COMPLETED").map((c) => c.itemId)
  )

  const items = allItems.filter(
    (item) =>
      item.status === "ACTIVE" ||
      (item.type === "TODO" &&
        item.status === "COMPLETED" &&
        (completedThisWeekItemIds.has(item.id) ||
          checkInMap.get(item.id)?.status === "COMPLETED"))
  )

  const item120CheckInsMap = new Map<
    string,
    Array<{ date: string; status: string }>
  >()
  batchCheckIns120.forEach((c) => {
    let list = item120CheckInsMap.get(c.itemId)
    if (!list) {
      list = []
      item120CheckInsMap.set(c.itemId, list)
    }
    list.push(c)
  })

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

      // Calculate streak metrics with preloaded item & checkins (in-memory O(1) DB cost)
      const streaks = await calculateItemStreaks(item.id, dateStr, {
        item,
        checkIns: item120CheckInsMap.get(item.id) || [],
      })

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
        priority: item.priority,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        title: item.title,
        whyPrompt: item.whyPrompt,
        type: item.type,
        layer: item.layer,
        customCategory: item.category?.name || item.customCategory || null,
        status: item.status,
        colorCode: item.colorCode,
        dueDate: item.dueDate,
        todoRecurrence: item.todoRecurrence || item.frequencyDays,
        unitType: item.unitType || null,
        targetAmount: item.targetAmount || null,
        unitLabel: item.unitLabel || null,
        recommendedAction,
        actionPresets: item.actionPresets,
        recommendedTool: matchingTool,
        toolLinks: item.toolLinks,
        tomorrowHint: nextIntentMap.get(item.id) || null,
        todayCheckIn: checkIn
          ? {
              id: checkIn.id,
              updatedAt: checkIn.updatedAt.toISOString(),
              status: checkIn.status as CheckInStatus,
              actualEnergy: checkIn.actualEnergy as EnergyLevel,
              actionText: checkIn.actionText,
              actualAmount: checkIn.actualAmount || null,
              completionRate: checkIn.completionRate || null,
              restReasonTag: checkIn.restReasonTag || null,
              notes: checkIn.notes,
              nextIntent: checkIn.nextIntent || null,
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
