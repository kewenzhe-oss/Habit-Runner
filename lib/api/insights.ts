import { EnergyLevel, Layer, WeeklyInsightsData } from "@/types"

import { LAYER_LIST } from "@/config/layers"
import { getUserTimeZone } from "@/lib/api/user-date"
import { db } from "@/lib/db"
import { calendarDaysInclusive, createdAtCalendarDate } from "@/lib/domain/date"
import { countScheduledOpportunities } from "@/lib/domain/schedule"
import { getDictionary, formatString, Locale } from "@/lib/i18n"

export async function getWeeklyInsights(
  userId: string,
  startDateStr: string,
  endDateStr: string,
  locale: Locale = "zh"
): Promise<WeeklyInsightsData> {
  const dict = getDictionary(locale).insights.dynamicTemplates
  const dailyEnergies = await db.dailyEnergyState.findMany({
    where: { userId, date: { gte: startDateStr, lte: endDateStr } },
  })

  const energyCount = { HIGH: 0, NORMAL: 0, LOW: 0, REST: 0, UNLOGGED: 0 }
  dailyEnergies.forEach((state) => {
    energyCount[state.energyLevel as EnergyLevel]++
  })
  energyCount.UNLOGGED = Math.max(
    0,
    calendarDaysInclusive(startDateStr, endDateStr) - dailyEnergies.length
  )

  const [checkIns, items, timeZone] = await Promise.all([
    db.checkIn.findMany({
      where: { userId, date: { gte: startDateStr, lte: endDateStr } },
      include: {
        item: { select: { layer: true, type: true, title: true } },
      },
    }),
    db.item.findMany({
      where: {
        userId,
        status: { not: "ARCHIVED" },
        createdAt: { lte: new Date(`${endDateStr}T23:59:59.999Z`) },
      },
      select: {
        id: true,
        layer: true,
        type: true,
        createdAt: true,
        dueDate: true,
        frequencyDays: true,
        targetPerWeek: true,
      },
    }),
    getUserTimeZone(userId),
  ])

  const layerStats = new Map<
    Layer,
    { connected: number; opportunities: number }
  >()
  LAYER_LIST.forEach((layer) =>
    layerStats.set(layer.key, { connected: 0, opportunities: 0 })
  )

  items.forEach((item) => {
    const createdDate = createdAtCalendarDate(item.createdAt, timeZone)
    const activeStart = createdDate > startDateStr ? createdDate : startDateStr
    if (activeStart > endDateStr) return

    let opportunities = 0
    if (item.type === "HABIT") {
      opportunities = countScheduledOpportunities(activeStart, endDateStr, item)
    } else if (item.type === "QUIT_HABIT") {
      opportunities = calendarDaysInclusive(activeStart, endDateStr)
    } else if (
      (item.dueDate &&
        item.dueDate >= startDateStr &&
        item.dueDate <= endDateStr) ||
      (!item.dueDate && createdDate >= startDateStr)
    ) {
      opportunities = 1
    }

    const stat = layerStats.get(item.layer as Layer)
    if (stat) stat.opportunities += opportunities
  })

  let habitActionsCompleted = 0
  let quitsMaintainedDays = 0
  let todosFinished = 0
  let lowEnergyActionsCount = 0
  const restDates = new Set<string>()

  checkIns.forEach((checkIn) => {
    const stat = layerStats.get(checkIn.item.layer as Layer)
    if (
      stat &&
      (checkIn.status === "COMPLETED" ||
        checkIn.status === "KEPT" ||
        checkIn.status === "REST")
    ) {
      stat.connected++
    }

    if (checkIn.item.type === "HABIT" && checkIn.status === "COMPLETED") {
      habitActionsCompleted++
      if (checkIn.actualEnergy === "LOW") lowEnergyActionsCount++
    }
    if (checkIn.status === "REST") restDates.add(checkIn.date)
    if (checkIn.item.type === "QUIT_HABIT" && checkIn.status === "KEPT") {
      quitsMaintainedDays++
    }
    if (checkIn.item.type === "TODO" && checkIn.status === "COMPLETED") {
      todosFinished++
    }
  })

  const layerDistribution = LAYER_LIST.map((layer) => {
    const stat = layerStats.get(layer.key) || { connected: 0, opportunities: 0 }
    return {
      layer: layer.key,
      label: `${layer.label} (${layer.zhLabel})`,
      color: layer.color,
      completedCount: stat.connected,
      totalCheckIns: checkIns.filter(
        (checkIn) => checkIn.item.layer === layer.key
      ).length,
      opportunityCount: stat.opportunities,
      connectionRate:
        stat.opportunities > 0
          ? Math.min(
              100,
              Math.round((stat.connected / stat.opportunities) * 100)
            )
          : 0,
    }
  })

  let descriptiveInsight = dict.defaultConnection
  if (energyCount.LOW >= 2 && lowEnergyActionsCount > 0) {
    descriptiveInsight = formatString(dict.lowEnergy, {
      lowDays: energyCount.LOW,
      lowActions: lowEnergyActionsCount,
    })
  } else if (energyCount.REST >= 2) {
    descriptiveInsight = formatString(dict.rest, {
      restDays: energyCount.REST,
    })
  } else if (habitActionsCompleted >= 5) {
    descriptiveInsight = formatString(dict.habit, {
      habitCount: habitActionsCompleted,
    })
  } else if (quitsMaintainedDays >= 3) {
    descriptiveInsight = formatString(dict.quit, {
      quitDays: quitsMaintainedDays,
    })
  }

  return {
    dateRange: { from: startDateStr, to: endDateStr },
    energyDistribution: energyCount,
    layerDistribution,
    descriptiveInsight,
    completionSummary: {
      habitActionsCompleted,
      restDaysChosen: restDates.size,
      quitsMaintainedDays,
      todosFinished,
    },
  }
}
