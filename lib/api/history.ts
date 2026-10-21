import { CheckInStatus, EnergyLevel, ItemType, Layer } from "@/types"

import { calculateItemStreaks } from "@/lib/api/checkin"
import { getUserItems } from "@/lib/api/items"
import { db } from "@/lib/db"
import {
  addCalendarDays,
  calendarDayOfWeek,
  calendarDaysInclusive,
  enumerateCalendarDates,
  getCalendarWeekDates,
} from "@/lib/domain/date"

export type HistoryStage = "STARTER" | "FORMING" | "MATURE"

export type GlobalHeatmapDay = {
  dateStr: string
  dayOfWeek: number // 1 is Mon, ..., 7 is Sun
  isToday: boolean
  isFuture: boolean
  totalCount: number
  hasRest: boolean
  primaryEnergy: EnergyLevel | null
  statusSummary: CheckInStatus | null
  actions: Array<{
    title: string
    type: ItemType
    status: CheckInStatus
    actualEnergy?: EnergyLevel | null
  }>
}

export type RecentActionRecord = {
  id: string
  itemId: string
  title: string
  date: string
  dayOfWeekZh: string
  dayOfWeekEn: string
  status: CheckInStatus
  actualEnergy?: EnergyLevel | null
  actionText?: string | null
}

export type HistoryItemSummary = {
  id: string
  title: string
  type: ItemType
  layer: Layer
  customCategory: string | null
  colorCode: string | null
  actionStreak: number
  rhythmStreak: number
  longestActionStreak: number
  maintainedDays: number
  totalCompletedCount: number
  recent7Days: Array<{
    date: string
    dayOfWeek: number
    status: CheckInStatus | null
    actualEnergy?: EnergyLevel | null
    isToday: boolean
    isFuture: boolean
  }>
}

export type CompletedTodoSummary = {
  id: string
  title: string
  customCategory: string | null
  colorCode: string | null
  completedDate: string | null
  dueDate: string | null
}

export type ActivityHistoryData = {
  todayStr: string
  stage: HistoryStage
  overview: {
    totalCheckIns: number
    activeDaysCount: number
    maxCurrentStreak: number
    activeHabitsCount: number
    effectiveSpanDays: number
    defaultWindowWeeks: 4 | 8 | 16
  }
  thisWeekDays: GlobalHeatmapDay[]
  recentActions: RecentActionRecord[]
  heatmapDays: GlobalHeatmapDay[]
  activeItems: HistoryItemSummary[]
  completedTodos: CompletedTodoSummary[]
}

const WEEKDAY_NAMES_ZH = [
  "周日",
  "周一",
  "周二",
  "周三",
  "周四",
  "周五",
  "周六",
]
const WEEKDAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export async function getActivityHistoryData(
  userId: string,
  todayStr: string
): Promise<ActivityHistoryData> {
  // 1. Generate 112 days (16 full natural weeks Mon-Sun) ending on Sunday of current week
  const thisWeekDates = getCalendarWeekDates(todayStr)
  const currentWeekSunday = thisWeekDates[6]
  const startDateStr = addCalendarDays(currentWeekSunday, -111) // 16 * 7 = 112 days
  const heatmapDates = enumerateCalendarDates(startDateStr, currentWeekSunday)

  // 2. Start the independent reads immediately. The streak read only needs the
  // item IDs, so it can start as soon as items resolve without waiting for
  // these queries to finish.
  const itemsPromise = getUserItems(userId, {
    status: ["ACTIVE", "COMPLETED"],
    includeCheckInCount: false,
  })
  const independentQueriesPromise = Promise.all([
    db.checkIn.findMany({
      where: {
        userId,
        date: { gte: startDateStr, lte: todayStr },
        item: { type: { in: ["HABIT", "QUIT_HABIT"] } },
      },
      include: {
        item: {
          select: { id: true, title: true, type: true, layer: true },
        },
      },
      orderBy: { date: "asc" },
    }),
    db.checkIn.groupBy({
      by: ["date"],
      where: {
        userId,
        item: { type: { in: ["HABIT", "QUIT_HABIT"] } },
      },
      _count: { id: true },
    }),
    db.item.findMany({
      where: {
        userId,
        type: "TODO",
        status: "COMPLETED",
      },
      include: {
        category: { select: { name: true } },
        checkIns: {
          where: { status: "COMPLETED" },
          orderBy: { date: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.checkIn.findFirst({
      where: {
        userId,
        item: { type: { in: ["HABIT", "QUIT_HABIT"] } },
      },
      orderBy: { date: "asc" },
      select: { date: true },
    }),
    db.checkIn.findMany({
      where: {
        userId,
        item: { type: { in: ["HABIT", "QUIT_HABIT"] } },
      },
      include: {
        item: { select: { id: true, title: true, type: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ])

  const earliestLookbackDate = addCalendarDays(todayStr, -120)
  const batchCheckIns120Promise = itemsPromise.then((allItems) => {
    const habitItems = allItems.filter(
      (i) => i.type === "HABIT" || i.type === "QUIT_HABIT"
    )

    return db.checkIn.findMany({
      where: {
        userId,
        itemId: { in: habitItems.map((i) => i.id) },
        date: { gte: earliestLookbackDate, lte: todayStr },
      },
      select: { itemId: true, date: true, status: true },
      orderBy: { date: "desc" },
    })
  })

  // 3. Join the item and independent reads with the item-dependent streak read.
  const [
    allItems,
    [
      windowCheckIns,
      allTimeStats,
      recentCompletedTodos,
      earliestCheckIn,
      latestActions,
    ],
    batchCheckIns120,
  ] = await Promise.all([
    itemsPromise,
    independentQueriesPromise,
    batchCheckIns120Promise,
  ])
  const habitItems = allItems.filter(
    (i) => i.type === "HABIT" || i.type === "QUIT_HABIT"
  )

  // Map checkins by date
  const dateCheckInsMap = new Map<string, typeof windowCheckIns>()
  const itemCheckInCountMap = new Map<string, number>()
  const itemRecentMap = new Map<
    string,
    Map<string, (typeof windowCheckIns)[0]>
  >()

  let totalCheckInsCount = 0

  windowCheckIns.forEach((c) => {
    totalCheckInsCount++

    // Date map
    const list = dateCheckInsMap.get(c.date) || []
    list.push(c)
    dateCheckInsMap.set(c.date, list)

    // Item count map
    itemCheckInCountMap.set(
      c.itemId,
      (itemCheckInCountMap.get(c.itemId) || 0) + 1
    )

    // Item date map
    let itemMap = itemRecentMap.get(c.itemId)
    if (!itemMap) {
      itemMap = new Map()
      itemRecentMap.set(c.itemId, itemMap)
    }
    itemMap.set(c.date, c)
  })

  // 4. Build 112-day Natural Calendar Week Heatmap array (Habits only)
  const heatmapDays: GlobalHeatmapDay[] = heatmapDates.map((dateStr, idx) => {
    const isToday = dateStr === todayStr
    const isFuture = dateStr > todayStr
    const dayOfWeek = (idx % 7) + 1 // 1 is Mon, 7 is Sun
    const checkInsOnDate = dateCheckInsMap.get(dateStr) || []

    let totalCount = 0
    let hasRest = false
    let hasHigh = false
    let hasNormal = false
    let hasLow = false

    const actions = checkInsOnDate.map((c) => {
      if (c.status === "COMPLETED" || c.status === "KEPT") {
        totalCount++
        if (c.actualEnergy === "HIGH") hasHigh = true
        else if (c.actualEnergy === "LOW") hasLow = true
        else hasNormal = true
      } else if (c.status === "REST") {
        hasRest = true
      }
      return {
        title: c.item.title,
        type: c.item.type as ItemType,
        status: c.status as CheckInStatus,
        actualEnergy: (c.actualEnergy as EnergyLevel) || null,
      }
    })

    let primaryEnergy: EnergyLevel | null = null
    if (hasHigh) primaryEnergy = "HIGH"
    else if (hasNormal) primaryEnergy = "NORMAL"
    else if (hasLow) primaryEnergy = "LOW"
    else if (hasRest) primaryEnergy = "REST"

    let statusSummary: CheckInStatus | null = null
    if (totalCount > 0) statusSummary = "COMPLETED"
    else if (hasRest) statusSummary = "REST"

    return {
      dateStr,
      dayOfWeek,
      isToday,
      isFuture,
      totalCount,
      hasRest,
      primaryEnergy,
      statusSummary,
      actions,
    }
  })

  // 5. Slice this week's 7 days for Starter stage view
  const thisWeekDays = heatmapDays.slice(-7)

  // 6. Format recent actions
  const recentActions: RecentActionRecord[] = latestActions.map((a) => {
    const rawDow = calendarDayOfWeek(a.date)
    return {
      id: a.id,
      itemId: a.itemId,
      title: a.item.title,
      date: a.date,
      dayOfWeekZh: WEEKDAY_NAMES_ZH[rawDow] || "",
      dayOfWeekEn: WEEKDAY_NAMES_EN[rawDow] || "",
      status: a.status as CheckInStatus,
      actualEnergy: (a.actualEnergy as EnergyLevel) || null,
      actionText: a.actionText,
    }
  })

  // 7. Build Active Habits summary with streak metrics (Habits only)
  let maxCurrentStreak = 0

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

  const activeItems: HistoryItemSummary[] = await Promise.all(
    habitItems.map(async (item) => {
      const streaks = await calculateItemStreaks(item.id, todayStr, {
        item,
        checkIns: item120CheckInsMap.get(item.id) || [],
      })
      const currentStreak =
        item.type === "QUIT_HABIT"
          ? streaks.maintainedDays
          : streaks.rhythmStreak

      if (currentStreak > maxCurrentStreak) {
        maxCurrentStreak = currentStreak
      }

      const itemMap = itemRecentMap.get(item.id)
      const recent7Days = thisWeekDates.map((d, idx) => {
        const c = itemMap?.get(d)
        const isToday = d === todayStr
        const isFuture = d > todayStr
        return {
          date: d,
          dayOfWeek: idx + 1, // 1 is Mon, 7 is Sun
          status: (c?.status as CheckInStatus) || null,
          actualEnergy: (c?.actualEnergy as EnergyLevel) || null,
          isToday,
          isFuture,
        }
      })

      return {
        id: item.id,
        title: item.title,
        type: item.type,
        layer: item.layer,
        customCategory: item.category?.name || item.customCategory || null,
        colorCode: item.colorCode,
        actionStreak: streaks.actionStreak,
        rhythmStreak: streaks.rhythmStreak,
        longestActionStreak: streaks.longestActionStreak,
        maintainedDays: streaks.maintainedDays,
        totalCompletedCount: itemCheckInCountMap.get(item.id) || 0,
        recent7Days,
      }
    })
  )

  // Sort active habits: ongoing high streak first
  activeItems.sort((a, b) => {
    const streakA = a.type === "QUIT_HABIT" ? a.maintainedDays : a.rhythmStreak
    const streakB = b.type === "QUIT_HABIT" ? b.maintainedDays : b.rhythmStreak
    return streakB - streakA || b.totalCompletedCount - a.totalCompletedCount
  })

  // 8. Map completed TODOs (stream of closed tasks)
  const completedTodos: CompletedTodoSummary[] = recentCompletedTodos.map(
    (t) => ({
      id: t.id,
      title: t.title,
      customCategory: t.category?.name || t.customCategory || null,
      colorCode: t.colorCode,
      completedDate:
        t.checkIns[0]?.date || t.updatedAt.toISOString().split("T")[0],
      dueDate: t.dueDate,
    })
  )

  // 9. Calculate stage & effective span
  const effectiveSpanDays = earliestCheckIn
    ? calendarDaysInclusive(earliestCheckIn.date, todayStr)
    : 0

  const activeDaysCount = allTimeStats.length

  let stage: HistoryStage = "STARTER"
  if (effectiveSpanDays >= 42 && activeDaysCount >= 15) {
    stage = "MATURE"
  } else if (effectiveSpanDays >= 14 && activeDaysCount >= 5) {
    stage = "FORMING"
  } else {
    stage = "STARTER"
  }

  const defaultWindowWeeks: 4 | 8 | 16 =
    stage === "MATURE" ? 16 : stage === "FORMING" ? 8 : 4

  return {
    todayStr,
    stage,
    overview: {
      totalCheckIns: totalCheckInsCount,
      activeDaysCount,
      maxCurrentStreak,
      activeHabitsCount: habitItems.filter((i) => i.status === "ACTIVE").length,
      effectiveSpanDays,
      defaultWindowWeeks,
    },
    thisWeekDays,
    recentActions,
    heatmapDays,
    activeItems,
    completedTodos,
  }
}
