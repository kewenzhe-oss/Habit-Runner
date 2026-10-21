"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ItemTrendData, TrendDailyPoint } from "@/lib/api/trends"
import {
  formatLocalizedDate,
  formatLocalizedDateRange,
  formatLocalizedTimes,
  useI18n,
} from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Icons } from "@/components/icons"

interface HabitTrendChartProps {
  initialData: ItemTrendData
}

interface CalendarCell {
  key: string
  isPlaceholder: boolean
  point?: TrendDailyPoint
  date?: string
}

function getMonthLabel(dateStr: string, locale: string) {
  const parts = dateStr.split("-")
  if (parts.length < 2) return ""
  const monthNum = parseInt(parts[1], 10)
  if (locale === "zh") {
    return `${monthNum}月`
  }
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  return months[monthNum - 1] || ""
}

function getWeekdayLong(dateStr: string, locale: string) {
  const day = new Date(`${dateStr}T12:00:00Z`).getUTCDay()
  const zhDays = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ]
  const enDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]
  return locale === "zh" ? zhDays[day] : enDays[day]
}

function formatCompactWeekRange(
  startDate: string,
  endDate: string,
  locale: string
): string {
  try {
    const [startYear, startMonth, startDay] = startDate.split("-")
    const [endYear, endMonth, endDay] = endDate.split("-")

    if (locale === "zh") {
      if (startYear === endYear) {
        return `${startMonth}.${startDay} ~ ${endMonth}.${endDay}`
      }
      return `${startYear.slice(2)}.${startMonth}.${startDay} ~ ${endYear.slice(2)}.${endMonth}.${endDay}`
    }

    const MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    const sMonth = MONTHS[parseInt(startMonth, 10) - 1] || startMonth
    const eMonth = MONTHS[parseInt(endMonth, 10) - 1] || endMonth

    if (startYear === endYear) {
      return `${sMonth} ${parseInt(startDay, 10)} – ${eMonth} ${parseInt(endDay, 10)}`
    }
    return `${sMonth} ${parseInt(startDay, 10)}, '${startYear.slice(2)} – ${eMonth} ${parseInt(endDay, 10)}, '${endYear.slice(2)}`
  } catch {
    return `${startDate} ~ ${endDate}`
  }
}

export function HabitTrendChart({ initialData }: HabitTrendChartProps) {
  const { dict: fullDict, locale, format } = useI18n()
  const dict = fullDict.item.trendChart
  const [data, setData] = React.useState<ItemTrendData>(initialData)
  const [rangeDays, setRangeDays] = React.useState<30 | 90>(
    initialData.rangeDays === 90 ? 90 : 30
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const weekCount = data.weeklyPoints.length
  const weekCountLabel = format(
    weekCount === 1 ? dict.weekCountOne : dict.weekCountOther,
    { count: weekCount }
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleRangeChange = async (newRange: 30 | 90) => {
    if (newRange === rangeDays) return
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/items/${data.itemId}/trend?rangeDays=${newRange}`
      )
      if (!res.ok) throw new Error("Failed to fetch trend")
      const updated = await res.json()
      setData(updated)
      setRangeDays(newRange)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  // Calendar Heatmap: Alignment & Month Headers calculation
  const calendarData = React.useMemo(() => {
    if (data.type !== "HABIT" || !data.dailyPoints.length) {
      return { cells: [], numCols: 0, monthHeaders: [] }
    }

    const firstPoint = data.dailyPoints[0]
    // JS getUTCDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    const firstDay = new Date(`${firstPoint.date}T12:00:00Z`).getUTCDay()
    // ISO Monday-first offset: Mon -> 0, Tue -> 1, ... Sun -> 6
    const startOffset = (firstDay + 6) % 7

    const cells: CalendarCell[] = []
    for (let i = 0; i < startOffset; i++) {
      cells.push({
        key: `pre-pad-${i}`,
        isPlaceholder: true,
      })
    }

    data.dailyPoints.forEach((point) => {
      cells.push({
        key: point.date,
        isPlaceholder: false,
        point,
        date: point.date,
      })
    })

    const trailingPad = (7 - (cells.length % 7)) % 7
    for (let i = 0; i < trailingPad; i++) {
      cells.push({
        key: `post-pad-${i}`,
        isPlaceholder: true,
      })
    }

    const numCols = cells.length / 7

    // Month headers: identify when month changes
    const monthHeaders: { colIndex: number; label: string }[] = []
    let lastMonth = ""

    for (let c = 0; c < numCols; c++) {
      const colCells = cells.slice(c * 7, c * 7 + 7)
      const firstReal = colCells.find(
        (cell) => !cell.isPlaceholder && cell.date
      )
      if (firstReal && firstReal.date) {
        const m = firstReal.date.slice(0, 7) // YYYY-MM
        if (m !== lastMonth) {
          monthHeaders.push({
            colIndex: c,
            label: getMonthLabel(firstReal.date, locale),
          })
          lastMonth = m
        }
      }
    }

    return { cells, numCols, monthHeaders }
  }, [data.dailyPoints, data.type, locale])

  // Energy Mix Distribution calculation
  const energyMix = React.useMemo(() => {
    if (data.type !== "HABIT") return null
    const points = data.dailyPoints
    const totalLogged = points.filter((p) => p.isLogged).length
    const highCount = points.filter((p) => p.actualEnergy === "HIGH").length
    const normalCount = points.filter(
      (p) =>
        p.actualEnergy === "NORMAL" ||
        (!p.actualEnergy && p.status === "COMPLETED")
    ).length
    const lowCount = points.filter((p) => p.actualEnergy === "LOW").length
    const restCount = points.filter((p) => p.status === "REST").length

    const getPct = (val: number) =>
      totalLogged > 0 ? Math.round((val / totalLogged) * 100) : 0

    return {
      totalLogged,
      high: { count: highCount, pct: getPct(highCount) },
      normal: { count: normalCount, pct: getPct(normalCount) },
      low: { count: lowCount, pct: getPct(lowCount) },
      rest: { count: restCount, pct: getPct(restCount) },
    }
  }, [data.dailyPoints, data.type])

  // Cell Color Classes
  const getHeatmapColorClass = (point: TrendDailyPoint) => {
    if (!point.isScheduled) {
      return "bg-transparent border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60"
    }
    if (point.status === "REST") {
      return "bg-purple-500 text-white dark:bg-purple-600 shadow-xs ring-1 ring-purple-400/40"
    }
    if (point.actualEnergy === "HIGH") {
      return "bg-emerald-700 text-white dark:bg-emerald-600 shadow-xs ring-1 ring-emerald-500/40"
    }
    if (point.actualEnergy === "NORMAL" || point.status === "COMPLETED") {
      return "bg-emerald-500 text-white shadow-xs ring-1 ring-emerald-400/40"
    }
    if (point.actualEnergy === "LOW") {
      return "bg-amber-500 text-white dark:bg-amber-600 shadow-xs ring-1 ring-amber-400/40"
    }
    return "bg-muted/60 border border-border/80 hover:bg-muted"
  }

  const getPointStatusLabel = (point: TrendDailyPoint) => {
    if (!point.isScheduled) return dict.statusNotScheduled
    if (point.status === "REST") return dict.statusRest
    if (point.actualEnergy === "HIGH") return dict.statusHigh
    if (point.actualEnergy === "LOW") return dict.statusLow
    if (point.actualEnergy === "NORMAL" || point.status === "COMPLETED") {
      return dict.statusNormal
    }
    return point.isLogged ? dict.recorded : dict.statusUnlogged
  }

  const getPointAriaLabel = (point: TrendDailyPoint) =>
    format(dict.cellAria, {
      date: point.date,
      status: getPointStatusLabel(point),
      action: point.actionText || point.notes || dict.statusUnlogged,
    })

  // Quit Habit Tooltip
  const QuitTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload
      const count = p.occurrenceCount
      const isZero = count === 0
      const formattedDateRange = formatLocalizedDateRange(
        p.startDate,
        p.endDate,
        locale
      )

      return (
        <div className="space-y-1 rounded-lg border bg-background/95 p-3 text-xs shadow-lg backdrop-blur">
          <div className="font-bold text-foreground">{p.weekLabel}</div>
          <div className="text-[11px] text-muted-foreground">
            {formattedDateRange}
          </div>
          <div className="flex items-center gap-2 border-t pt-1">
            <span className="font-semibold text-foreground">
              {dict.tooltipOccurrences}
              <span
                className={
                  isZero
                    ? "font-bold text-emerald-700 dark:text-emerald-300"
                    : "font-bold text-amber-700 dark:text-amber-300"
                }
              >
                {count === null
                  ? dict.unrecordedLabel
                  : formatLocalizedTimes(count, locale)}
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              (
              {format(dict.tooltipRecordedDays, {
                recorded: p.recordedDays,
                scheduled: p.scheduledDays,
              })}
              )
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  // Todo Tooltip
  const TodoTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload
      const formattedDateRange = formatLocalizedDateRange(
        p.startDate,
        p.endDate,
        locale
      )

      return (
        <div className="space-y-1 rounded-lg border bg-background/95 p-3 text-xs shadow-lg backdrop-blur">
          <div className="font-bold text-foreground">{p.weekLabel}</div>
          <div className="text-[11px] text-muted-foreground">
            {formattedDateRange}
          </div>
          <div className="border-t pt-1 font-semibold text-foreground">
            {dict.tooltipTodoRate}
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {p.completionRate}%
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-col justify-between gap-3 pb-2 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold tracking-tight">
              {data.type === "QUIT_HABIT"
                ? dict.titleQuit
                : data.type === "TODO"
                  ? dict.titleTodo
                  : dict.titleHabit}
            </CardTitle>
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Icons.sparkles className="h-3 w-3" />
              <span>
                {data.type === "QUIT_HABIT" ? dict.tagQuit : dict.tagHabit}
              </span>
            </span>
          </div>
          <CardDescription className="text-xs">
            {data.type === "QUIT_HABIT"
              ? dict.descQuit
              : data.type === "TODO"
                ? dict.descTodo
                : dict.descHabit}
          </CardDescription>
        </div>

        {/* Time Window Switcher (30 days / 90 days) */}
        <div className="flex items-center gap-1 self-start rounded-lg border bg-muted/40 p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => handleRangeChange(30)}
            disabled={isLoading}
            aria-pressed={rangeDays === 30}
            className={cn(
              "min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
              rangeDays === 30
                ? "shadow-xs bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {dict.range30}
          </button>
          <button
            type="button"
            onClick={() => handleRangeChange(90)}
            disabled={isLoading}
            aria-pressed={rangeDays === 90}
            className={cn(
              "min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
              rangeDays === 90
                ? "shadow-xs bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {dict.range90}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-1">
        {/* TYPE 1: POSITIVE HABIT */}
        {data.type === "HABIT" && (
          <div className="space-y-5">
            {/* Dual Column: Heatmap (Left) + Energy Mix (Right) */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              {/* Left Column: Heatmap Matrix (lg:col-span-8) */}
              <div className="space-y-3 lg:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {format(dict.period, {
                      start: data.startDate,
                      end: data.endDate,
                    })}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {dict.tapDay}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border bg-muted/10 p-3.5 pb-2.5">
                  <div className="inline-block min-w-full">
                    {/* Top Month Header aligned with columns */}
                    <div className="flex items-center gap-2">
                      {/* Left spacing to match weekday labels width */}
                      <div className="w-4 shrink-0" />
                      <div
                        className="grid select-none gap-1.5 pb-1 text-[10px] font-medium text-muted-foreground/80"
                        style={{
                          gridTemplateColumns: `repeat(${calendarData.numCols}, minmax(18px, 1fr))`,
                        }}
                      >
                        {Array.from({ length: calendarData.numCols }).map(
                          (_, c) => {
                            const header = calendarData.monthHeaders.find(
                              (h) => h.colIndex === c
                            )
                            return (
                              <div
                                key={c}
                                className="truncate text-left font-semibold"
                              >
                                {header ? header.label : ""}
                              </div>
                            )
                          }
                        )}
                      </div>
                    </div>

                    {/* Matrix Grid: Y-axis Weekday labels + Cells */}
                    <div className="flex items-start gap-2">
                      {/* Y-axis Weekday labels (Mon, Wed, Fri, Sun) */}
                      <div className="grid grid-rows-7 gap-1.5 pt-0.5 text-[9px] font-medium text-muted-foreground/70">
                        {(locale === "zh"
                          ? ["一", "", "三", "", "五", "", "日"]
                          : ["M", "", "W", "", "F", "", "S"]
                        ).map((lbl, i) => (
                          <div
                            key={i}
                            className="flex h-5 w-4 items-center justify-center font-medium"
                          >
                            {lbl}
                          </div>
                        ))}
                      </div>

                      {/* Day Cells Grid */}
                      <div
                        className="grid grid-flow-col grid-rows-7 gap-1.5"
                        style={{
                          gridTemplateColumns: `repeat(${calendarData.numCols}, minmax(18px, 1fr))`,
                        }}
                      >
                        {calendarData.cells.map((cell) => {
                          if (cell.isPlaceholder) {
                            return (
                              <div
                                key={cell.key}
                                className="rounded-xs h-5 w-5 border border-dashed border-muted-foreground/15 bg-muted/10"
                                aria-hidden="true"
                              />
                            )
                          }

                          const point = cell.point!
                          return (
                            <Popover key={cell.key}>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(
                                    "rounded-xs h-5 w-5 cursor-pointer transition-all duration-150 hover:z-10 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    getHeatmapColorClass(point)
                                  )}
                                  aria-label={getPointAriaLabel(point)}
                                />
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-72 max-w-[calc(100vw-2rem)] space-y-2.5 p-3.5 text-xs shadow-xl backdrop-blur-md"
                                side="top"
                                align="center"
                              >
                                {/* Popover Header: Date + Weekday + Status badge */}
                                <div className="flex items-center justify-between border-b pb-2">
                                  <div>
                                    <div className="font-bold text-foreground">
                                      {formatLocalizedDate(point.date, locale)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {getWeekdayLong(point.date, locale)}
                                    </div>
                                  </div>
                                  <span
                                    className={cn(
                                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                      point.status === "REST"
                                        ? "border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-950/70 dark:text-purple-300"
                                        : point.actualEnergy === "HIGH"
                                          ? "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                                          : point.actualEnergy === "NORMAL" ||
                                              point.status === "COMPLETED"
                                            ? "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                                            : point.actualEnergy === "LOW"
                                              ? "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                                              : !point.isScheduled
                                                ? "border-dashed bg-muted/50 text-muted-foreground"
                                                : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {getPointStatusLabel(point)}
                                  </span>
                                </div>

                                {/* Popover Content: Action text */}
                                {point.actionText && (
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                                      {dict.actionsLabel}
                                    </div>
                                    <p className="font-medium text-foreground">
                                      {point.actionText}
                                    </p>
                                  </div>
                                )}

                                {/* Popover Content: Notes / Reflections */}
                                {point.notes && (
                                  <div className="rounded-lg border bg-muted/30 p-2 text-[11px] italic text-muted-foreground">
                                    “{point.notes}”
                                  </div>
                                )}

                                {/* Popover Content: Next Intent */}
                                {point.nextIntent && (
                                  <div className="flex items-start gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                                    <Icons.sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>
                                      <strong>{dict.nextIntentLabel}</strong>
                                      {point.nextIntent}
                                    </span>
                                  </div>
                                )}

                                {!point.isLogged && point.isScheduled && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {dict.unloggedNote}
                                  </p>
                                )}
                              </PopoverContent>
                            </Popover>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Heatmap Legend */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-xs h-2.5 w-2.5 bg-emerald-700 ring-1 ring-border" />
                    <span>{dict.legendHigh}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-xs h-2.5 w-2.5 bg-emerald-500 ring-1 ring-border" />
                    <span>{dict.legendNormal}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-xs h-2.5 w-2.5 bg-amber-500 ring-1 ring-border" />
                    <span>{dict.legendLow}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-xs h-2.5 w-2.5 bg-purple-500 ring-1 ring-border" />
                    <span>{dict.legendRest}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-xs h-2.5 w-2.5 border bg-muted/60" />
                    <span>{dict.legendNoRecord}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-xs h-2.5 w-2.5 border border-dashed border-muted-foreground/40" />
                    <span>{dict.legendNotScheduled}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Energy Mix Distribution (lg:col-span-4) */}
              {energyMix && (
                <div className="space-y-3.5 rounded-xl border bg-muted/20 p-4 lg:col-span-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {dict.distribution}
                    </span>
                    <span className="rounded-full border bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {format(dict.connections, {
                        count: energyMix.totalLogged,
                      })}
                    </span>
                  </div>

                  {/* Multi-segment distribution bar */}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                    {energyMix.high.pct > 0 && (
                      <div
                        style={{ width: `${energyMix.high.pct}%` }}
                        className="bg-emerald-700 transition-all dark:bg-emerald-600"
                        title={`High: ${energyMix.high.pct}%`}
                      />
                    )}
                    {energyMix.normal.pct > 0 && (
                      <div
                        style={{ width: `${energyMix.normal.pct}%` }}
                        className="bg-emerald-500 transition-all"
                        title={`Normal: ${energyMix.normal.pct}%`}
                      />
                    )}
                    {energyMix.low.pct > 0 && (
                      <div
                        style={{ width: `${energyMix.low.pct}%` }}
                        className="bg-amber-500 transition-all"
                        title={`Low: ${energyMix.low.pct}%`}
                      />
                    )}
                    {energyMix.rest.pct > 0 && (
                      <div
                        style={{ width: `${energyMix.rest.pct}%` }}
                        className="bg-purple-500 transition-all"
                        title={`Rest: ${energyMix.rest.pct}%`}
                      />
                    )}
                  </div>

                  {/* Energy Breakdown List */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-700 dark:bg-emerald-600" />
                        <span className="text-muted-foreground">
                          {dict.legendHigh}
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {energyMix.high.count} {dict.dayUnit}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          ({energyMix.high.pct}%)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">
                          {dict.legendNormal}
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {energyMix.normal.count} {dict.dayUnit}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          ({energyMix.normal.pct}%)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">
                          {dict.legendLow}
                        </span>
                      </div>
                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                        {energyMix.low.count} {dict.timeUnit}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          ({energyMix.low.pct}%)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                        <span className="text-muted-foreground">
                          {dict.legendRest}
                        </span>
                      </div>
                      <span className="font-semibold text-purple-700 dark:text-purple-300">
                        {energyMix.rest.count} {dict.dayUnit}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          ({energyMix.rest.pct}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Coaching Tagline */}
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                    {energyMix.low.count + energyMix.rest.count > 0 ? (
                      <span className="flex items-center gap-1.5 font-medium text-foreground/90">
                        <Icons.sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{dict.resilienceNote}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-medium text-foreground/90">
                        <Icons.fire className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                        <span>{dict.fullEnergyNote}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upgraded 4 KPI Metric Cards */}
            <div className="grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                    <Icons.fire className="h-3.5 w-3.5" />
                  </span>
                  <span>{dict.statValidActionDays}</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {data.summary.totalCompleted}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {dict.dayUnit}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {dict.substantiveAction}
                </p>
              </div>

              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
                    <Icons.rest className="h-3.5 w-3.5" />
                  </span>
                  <span>{dict.statRestDays}</span>
                </div>
                <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                  {data.summary.totalRestDays}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {dict.dayUnit}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {dict.restRecharge}
                </p>
              </div>

              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                    <Icons.lowEnergy className="h-3.5 w-3.5" />
                  </span>
                  <span>{dict.statLowEnergyCount}</span>
                </div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                  {
                    data.dailyPoints.filter((d) => d.actualEnergy === "LOW")
                      .length
                  }{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {dict.timeUnit}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {dict.microStreak}
                </p>
              </div>

              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icons.sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span>{dict.statTotalRate}</span>
                </div>
                <div className="text-xl font-bold text-primary">
                  {data.summary.completionRate}%
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {dict.connectionRate}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TYPE 2: QUIT HABIT */}
        {data.type === "QUIT_HABIT" && (
          <div className="space-y-4">
            <div className="h-56 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.weeklyPoints}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="occurrenceGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#EA580C"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#EA580C"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.8}
                    />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--foreground))",
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, "auto"]}
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--foreground))",
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<QuitTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="occurrenceCount"
                      stroke="#EA580C"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#occurrenceGradient)"
                      connectNulls={false}
                      dot={{
                        r: 4.5,
                        fill: "#EA580C",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      activeDot={{ r: 6.5, fill: "#EA580C" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {dict.loadingOccurrences}
                </div>
              )}
            </div>

            {/* Quit Summary Metrics */}
            <div className="grid grid-cols-2 gap-3 border-t pt-3 text-xs sm:grid-cols-4">
              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statTotalKeptDays}
                </span>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {data.summary.totalKeptDays}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {dict.dayUnit}
                  </span>
                </div>
              </div>
              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statTotalOccurrences}
                </span>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                  {data.summary.totalOccurrences ?? data.summary.totalLapses}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {dict.timeUnit}
                  </span>
                </div>
              </div>
              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statZeroWeeks}
                </span>
                <div className="text-xl font-bold text-foreground">
                  {data.summary.fullyObservedZeroWeeks}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {data.weeklyPoints.length} {dict.weekUnit}
                  </span>
                </div>
              </div>
              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statObservationRate}
                </span>
                <div className="text-xl font-bold text-foreground">
                  {data.summary.observationRate}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TYPE 3: TODO */}
        {data.type === "TODO" && (
          <div className="space-y-4">
            <div className="h-56 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.weeklyPoints}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.8}
                    />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--foreground))",
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--foreground))",
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                      width={35}
                    />
                    <Tooltip content={<TodoTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      dot={{
                        r: 4.5,
                        fill: "#2563EB",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      activeDot={{ r: 6.5 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {dict.loadingTrend}
                </div>
              )}
            </div>

            {/* Todo Summary Metrics */}
            <div className="grid grid-cols-2 gap-3 border-t pt-3 text-xs">
              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statTotalFinished}
                </span>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {data.summary.totalCompleted}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {dict.taskUnit}
                  </span>
                </div>
              </div>
              <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statOverallRate}
                </span>
                <div className="text-xl font-bold text-foreground">
                  {data.summary.completionRate}%
                </div>
              </div>
            </div>
          </div>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={format(dict.weeklyDetailsAria, {
                weekCount: weekCountLabel,
              })}
              className="group flex min-h-[44px] w-full items-center justify-between rounded-xl border bg-muted/20 px-4 py-2.5 text-left text-xs transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex min-w-0 flex-wrap items-center gap-2 font-semibold text-foreground">
                <Icons.statsBar className="h-4 w-4 shrink-0 text-primary" />
                <span>{dict.toggleTable}</span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/70">
                  {weekCountLabel}
                </span>
              </span>
              <span className="ml-3 flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {dict.viewDetails}
                <Icons.chevronRight className="h-4 w-4" />
              </span>
            </button>
          </DialogTrigger>
          <DialogContent
            className="max-w-xl p-0"
            closeLabel={fullDict.common.actions.close}
          >
            <DialogHeader className="border-b px-5 py-5 pr-14 text-left sm:px-6">
              <DialogTitle className="text-lg font-semibold">
                {dict.weeklyDetailsTitle}
              </DialogTitle>
              <DialogDescription className="text-xs leading-5">
                {format(dict.weeklyDetailsDescription, {
                  start: data.startDate,
                  end: data.endDate,
                  weekCount: weekCountLabel,
                })}
              </DialogDescription>
            </DialogHeader>

            <div
              role="list"
              className="max-h-[60dvh] divide-y divide-border/40 overflow-y-auto overscroll-contain pr-1"
              aria-label={dict.weeklyDetailsListAria}
            >
              {data.weeklyPoints.map((week, index) => {
                const completion = week.completionRate ?? 0
                const isHigh =
                  week.completionRate !== null && week.completionRate >= 80
                const isGood =
                  week.completionRate !== null && week.completionRate >= 50
                const weekRange = formatCompactWeekRange(
                  week.startDate,
                  week.endDate,
                  locale
                )

                return (
                  <div
                    key={week.startDate}
                    role="listitem"
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-muted/25 sm:grid-cols-[minmax(150px,0.9fr)_minmax(150px,1.3fr)_auto] sm:items-center sm:px-6"
                  >
                    <div className="col-start-1 row-start-1 min-w-0 sm:col-start-1 sm:row-start-1">
                      <div className="font-mono text-sm font-semibold tracking-tight text-foreground">
                        {weekRange}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {format(dict.weekOrdinal, {
                          index: index + 1,
                        })}
                      </div>
                    </div>

                    <div className="col-span-2 col-start-1 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                      <div className="flex items-center gap-2.5">
                        <div
                          role="progressbar"
                          aria-label={
                            week.completionRate === null
                              ? dict.unrecordedLabel
                              : format(dict.weeklyRateAria, {
                                  rate: week.completionRate,
                                })
                          }
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={completion}
                          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className={cn(
                              "h-full rounded-full transition-[width] duration-300",
                              isHigh
                                ? "bg-emerald-500"
                                : isGood
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                            )}
                            style={{
                              width: `${Math.min(100, Math.max(0, completion))}%`,
                            }}
                          />
                        </div>
                        <span className="shrink-0 whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {format(dict.weeklyRecorded, {
                            recorded: week.recordedDays,
                            scheduled: week.scheduledDays,
                          })}
                        </span>
                      </div>
                    </div>

                    <span
                      aria-label={
                        week.completionRate === null
                          ? dict.unrecordedLabel
                          : format(dict.weeklyRateAria, {
                              rate: week.completionRate,
                            })
                      }
                      className={cn(
                        "col-start-2 row-start-1 inline-flex min-w-12 items-center justify-center self-start justify-self-end rounded-full border px-2.5 py-1 font-mono text-xs font-semibold sm:col-start-3 sm:row-start-1",
                        week.completionRate === null
                          ? "border-transparent bg-muted text-muted-foreground"
                          : isHigh
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : isGood
                              ? "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      )}
                    >
                      {week.completionRate === null
                        ? "—"
                        : `${week.completionRate}%`}
                    </span>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
