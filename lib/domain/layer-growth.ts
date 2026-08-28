import {
  CheckInStatus,
  ItemStatus,
  ItemType,
  Layer,
  LayerGrowthMatrixData,
  LayerGrowthPhase,
  LayerGrowthSampleState,
  LayerGrowthWeeklyPoint,
} from "@/types"

import { LAYER_LIST } from "@/config/layers"
import {
  addCalendarDays,
  calendarDayOfWeek,
  calendarDaysInclusive,
  enumerateCalendarDates,
} from "@/lib/domain/date"
import { countScheduledOpportunities } from "@/lib/domain/schedule"

export type LayerGrowthItemInput = {
  id: string
  layer: Layer
  type: ItemType
  status: ItemStatus
  createdDate: string
  archivedDate?: string | null
  frequencyDays?: string | null
  targetPerWeek?: number | null
  dueDate?: string | null
  todoRecurrence?: string | null
}

export type LayerGrowthCheckInInput = {
  itemId: string
  date: string
  status: CheckInStatus
}

export type BuildLayerGrowthMatrixInput = {
  asOfDate: string
  items: LayerGrowthItemInput[]
  checkIns: LayerGrowthCheckInInput[]
}

type Period = { from: string; to: string }

type ItemPeriodResult = {
  itemId: string
  connectedCount: number
  opportunityCount: number
  rate: number | null
}

type PeriodSummary = {
  score: number | null
  connectedCount: number
  opportunityCount: number
  itemCount: number
  itemResults: ItemPeriodResult[]
}

function maxDate(...dates: string[]): string {
  return dates.reduce((latest, date) => (date > latest ? date : latest))
}

function minDate(...dates: string[]): string {
  return dates.reduce((earliest, date) => (date < earliest ? date : earliest))
}

function startOfWeek(date: string): string {
  const day = calendarDayOfWeek(date)
  const daysSinceMonday = (day + 6) % 7
  return addCalendarDays(date, -daysSinceMonday)
}

function getActivePeriod(
  item: LayerGrowthItemInput,
  period: Period
): Period | null {
  const from = maxDate(period.from, item.createdDate)
  const to = item.archivedDate
    ? minDate(period.to, item.archivedDate)
    : period.to
  return from <= to ? { from, to } : null
}

function isConnectedStatus(itemType: ItemType, status: CheckInStatus): boolean {
  if (itemType === "HABIT") {
    return status === "COMPLETED" || status === "REST"
  }
  if (itemType === "QUIT_HABIT") return status === "KEPT"
  return status === "COMPLETED"
}

function countRecurringTodoOpportunities(
  from: string,
  to: string,
  anchorDate: string,
  recurrence: "WEEKLY" | "MONTHLY"
): number {
  const effectiveFrom = maxDate(from, anchorDate)
  if (effectiveFrom > to) return 0

  const buckets = new Set<string>()
  enumerateCalendarDates(effectiveFrom, to).forEach((date) => {
    buckets.add(recurrence === "WEEKLY" ? startOfWeek(date) : date.slice(0, 7))
  })
  return buckets.size
}

function countTodoOpportunities(
  item: LayerGrowthItemInput,
  period: Period,
  itemCheckIns: LayerGrowthCheckInInput[]
): number {
  const recurrence =
    item.todoRecurrence ||
    (item.frequencyDays === "WEEKLY" || item.frequencyDays === "MONTHLY"
      ? item.frequencyDays
      : "ONCE")

  if (recurrence === "WEEKLY" || recurrence === "MONTHLY") {
    return countRecurringTodoOpportunities(
      period.from,
      period.to,
      item.dueDate || item.createdDate,
      recurrence
    )
  }

  const firstCompletion = itemCheckIns
    .filter((checkIn) => checkIn.status === "COMPLETED")
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  if (item.status === "COMPLETED" && !firstCompletion) return 0
  const opportunityDate =
    firstCompletion?.date || item.dueDate || item.createdDate
  return opportunityDate >= period.from && opportunityDate <= period.to ? 1 : 0
}

export function getLayerGrowthPeriods(
  asOfDate: string
): LayerGrowthMatrixData["periods"] {
  const current30 = { from: addCalendarDays(asOfDate, -29), to: asOfDate }
  const previous30 = {
    from: addCalendarDays(asOfDate, -59),
    to: addCalendarDays(asOfDate, -30),
  }
  const currentWeekStart = startOfWeek(asOfDate)
  const stability12Weeks = {
    from: addCalendarDays(currentWeekStart, -77),
    to: asOfDate,
  }

  return { current30, previous30, stability12Weeks }
}

function summarizeItemPeriod(
  item: LayerGrowthItemInput,
  allCheckIns: LayerGrowthCheckInInput[],
  requestedPeriod: Period
): ItemPeriodResult {
  const activePeriod = getActivePeriod(item, requestedPeriod)
  if (!activePeriod) {
    return {
      itemId: item.id,
      connectedCount: 0,
      opportunityCount: 0,
      rate: null,
    }
  }

  const itemCheckIns = allCheckIns.filter(
    (checkIn) => checkIn.itemId === item.id
  )
  const periodCheckIns = itemCheckIns.filter(
    (checkIn) =>
      checkIn.date >= activePeriod.from && checkIn.date <= activePeriod.to
  )

  let opportunityCount = 0
  if (item.type === "HABIT") {
    opportunityCount = countScheduledOpportunities(
      activePeriod.from,
      activePeriod.to,
      item
    )
  } else if (item.type === "QUIT_HABIT") {
    opportunityCount = calendarDaysInclusive(activePeriod.from, activePeriod.to)
  } else {
    opportunityCount = countTodoOpportunities(item, activePeriod, itemCheckIns)
  }

  const recordedConnections = periodCheckIns.filter((checkIn) =>
    isConnectedStatus(item.type, checkIn.status)
  ).length
  const connectedCount = Math.min(recordedConnections, opportunityCount)

  return {
    itemId: item.id,
    connectedCount,
    opportunityCount,
    rate:
      opportunityCount > 0
        ? Math.min(100, (connectedCount / opportunityCount) * 100)
        : null,
  }
}

function summarizePeriod(
  items: LayerGrowthItemInput[],
  checkIns: LayerGrowthCheckInInput[],
  period: Period
): PeriodSummary {
  const itemResults = items.map((item) =>
    summarizeItemPeriod(item, checkIns, period)
  )
  const eligibleResults = itemResults.filter(
    (result): result is ItemPeriodResult & { rate: number } =>
      result.rate !== null
  )

  return {
    score:
      eligibleResults.length > 0
        ? Math.round(
            eligibleResults.reduce((sum, result) => sum + result.rate, 0) /
              eligibleResults.length
          )
        : null,
    connectedCount: eligibleResults.reduce(
      (sum, result) => sum + result.connectedCount,
      0
    ),
    opportunityCount: eligibleResults.reduce(
      (sum, result) => sum + result.opportunityCount,
      0
    ),
    itemCount: eligibleResults.length,
    itemResults,
  }
}

function buildWeekPeriods(from: string, to: string): Period[] {
  const periods: Period[] = []
  let cursor = startOfWeek(from)

  while (cursor <= to) {
    const weekTo = addCalendarDays(cursor, 6)
    periods.push({
      from: maxDate(cursor, from),
      to: minDate(weekTo, to),
    })
    cursor = addCalendarDays(cursor, 7)
  }

  return periods
}

function countEligibleWeeks(
  items: LayerGrowthItemInput[],
  checkIns: LayerGrowthCheckInInput[],
  period: Period
): number {
  return buildWeekPeriods(period.from, period.to).filter(
    (week) => summarizePeriod(items, checkIns, week).opportunityCount > 0
  ).length
}

export function getLayerGrowthSampleState(
  opportunityCount: number,
  effectiveWeeks: number
): LayerGrowthSampleState {
  if (opportunityCount === 0) return "NO_PLAN"
  if (opportunityCount < 4 || effectiveWeeks < 2) return "FORMING"
  if (opportunityCount < 12 || effectiveWeeks < 4) return "PRELIMINARY"
  return "SUFFICIENT"
}

function buildStability(
  items: LayerGrowthItemInput[],
  checkIns: LayerGrowthCheckInInput[],
  period: Period
): {
  connectedWeeks: number
  eligibleWeeks: number
  currentConnectedRun: number
  weeklySeries: LayerGrowthWeeklyPoint[]
} {
  const weeklySeries = buildWeekPeriods(period.from, period.to).map((week) => {
    const summary = summarizePeriod(items, checkIns, week)
    return {
      ...week,
      score: summary.score,
      connectedCount: summary.connectedCount,
      opportunityCount: summary.opportunityCount,
      hasConnection: summary.connectedCount > 0,
    }
  })
  const eligibleWeeks = weeklySeries.filter((week) => week.opportunityCount > 0)
  let currentConnectedRun = 0
  for (const week of [...weeklySeries].reverse()) {
    if (week.opportunityCount === 0) continue
    if (!week.hasConnection) break
    currentConnectedRun++
  }

  return {
    connectedWeeks: eligibleWeeks.filter((week) => week.hasConnection).length,
    eligibleWeeks: eligibleWeeks.length,
    currentConnectedRun,
    weeklySeries,
  }
}

function resolvePhase(
  foundationState: LayerGrowthSampleState,
  foundationScore: number | null,
  momentumState: LayerGrowthSampleState,
  deltaPercentagePoints: number | null,
  stability: {
    connectedWeeks: number
    eligibleWeeks: number
    currentConnectedRun: number
  }
): LayerGrowthPhase {
  if (foundationState === "NO_PLAN") return "NO_PLAN"
  if (foundationState === "FORMING") return "DATA_FORMING"
  if (foundationState === "PRELIMINARY") return "PRELIMINARY"
  if (momentumState !== "SUFFICIENT" || deltaPercentagePoints === null) {
    return "NEW_LAYER"
  }
  if (deltaPercentagePoints >= 5) return "GROWING"
  if (deltaPercentagePoints <= -5) {
    return foundationScore === 0 ? "TEMPORARILY_QUIET" : "RECONNECTING"
  }

  const stabilityRate =
    stability.eligibleWeeks > 0
      ? stability.connectedWeeks / stability.eligibleWeeks
      : 0
  return stabilityRate >= 0.75 && stability.currentConnectedRun >= 2
    ? "STABLE_ROOTED"
    : "KEEPING_RHYTHM"
}

export function buildLayerGrowthMatrix({
  asOfDate,
  items,
  checkIns,
}: BuildLayerGrowthMatrixInput): LayerGrowthMatrixData {
  const { current30, previous30, stability12Weeks } =
    getLayerGrowthPeriods(asOfDate)

  const layers = LAYER_LIST.map((layer) => {
    const layerItems = items.filter((item) => item.layer === layer.key)
    const foundation = summarizePeriod(layerItems, checkIns, current30)
    const currentEffectiveWeeks = countEligibleWeeks(
      layerItems,
      checkIns,
      current30
    )
    const foundationSampleState = getLayerGrowthSampleState(
      foundation.opportunityCount,
      currentEffectiveWeeks
    )

    const currentByItem = new Map(
      foundation.itemResults.map((result) => [result.itemId, result])
    )
    const previousAll = summarizePeriod(layerItems, checkIns, previous30)
    const previousByItem = new Map(
      previousAll.itemResults.map((result) => [result.itemId, result])
    )
    const comparableItems = layerItems.filter((item) => {
      const current = currentByItem.get(item.id)
      const previous = previousByItem.get(item.id)
      return Boolean(current?.opportunityCount && previous?.opportunityCount)
    })
    const comparableCurrent = summarizePeriod(
      comparableItems,
      checkIns,
      current30
    )
    const comparablePrevious = summarizePeriod(
      comparableItems,
      checkIns,
      previous30
    )

    let momentumSampleState: LayerGrowthSampleState = "NO_COMPARISON"
    if (comparableItems.length > 0) {
      const currentState = getLayerGrowthSampleState(
        comparableCurrent.opportunityCount,
        countEligibleWeeks(comparableItems, checkIns, current30)
      )
      const previousState = getLayerGrowthSampleState(
        comparablePrevious.opportunityCount,
        countEligibleWeeks(comparableItems, checkIns, previous30)
      )
      if (currentState === "FORMING" || previousState === "FORMING") {
        momentumSampleState = "FORMING"
      } else if (
        currentState === "PRELIMINARY" ||
        previousState === "PRELIMINARY"
      ) {
        momentumSampleState = "PRELIMINARY"
      } else if (
        currentState === "SUFFICIENT" &&
        previousState === "SUFFICIENT"
      ) {
        momentumSampleState = "SUFFICIENT"
      }
    }

    const rawDelta =
      comparableCurrent.score !== null && comparablePrevious.score !== null
        ? comparableCurrent.score - comparablePrevious.score
        : null
    const deltaPercentagePoints =
      momentumSampleState === "SUFFICIENT" ? rawDelta : null
    const stability = buildStability(layerItems, checkIns, stability12Weeks)

    return {
      layer: layer.key as Layer,
      label: `${layer.label} (${layer.zhLabel})`,
      color: layer.color,
      itemCount: foundation.itemCount,
      foundation: {
        score: foundation.score,
        connectedCount: foundation.connectedCount,
        opportunityCount: foundation.opportunityCount,
        sampleState: foundationSampleState,
      },
      momentum: {
        currentScore: comparableCurrent.score,
        previousScore: comparablePrevious.score,
        deltaPercentagePoints,
        comparableItemCount: comparableItems.length,
        sampleState: momentumSampleState,
      },
      stability,
      phase: resolvePhase(
        foundationSampleState,
        foundation.score,
        momentumSampleState,
        deltaPercentagePoints,
        stability
      ),
    }
  })

  return {
    periods: { current30, previous30, stability12Weeks },
    dataBasis: {
      planBasis: "CURRENT_PLAN_ESTIMATE",
      historyComplete: false,
    },
    layers,
  }
}
