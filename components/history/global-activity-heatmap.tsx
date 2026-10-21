"use client"

import * as React from "react"

import type { GlobalHeatmapDay } from "@/lib/api/history"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Icons } from "@/components/icons"

interface GlobalActivityHeatmapProps {
  days: GlobalHeatmapDay[]
  defaultWindowWeeks?: 4 | 8 | 16
  effectiveSpanDays?: number
}

const Y_AXIS_ZH = ["一", "", "三", "", "五", "", "日"]
const Y_AXIS_EN = ["M", "", "W", "", "F", "", "S"]

function getColorClass(day: GlobalHeatmapDay) {
  if (day.isFuture) {
    return "border border-dashed border-muted-foreground/30 bg-transparent"
  }

  if (day.totalCount > 0) {
    if (day.primaryEnergy === "HIGH") {
      return "bg-emerald-700 ring-1 ring-emerald-700/45 dark:bg-emerald-500"
    }
    if (day.primaryEnergy === "LOW") {
      return "bg-amber-500 ring-1 ring-amber-600/40 dark:bg-amber-400"
    }
    return "bg-emerald-500 ring-1 ring-emerald-600/35 dark:bg-emerald-400"
  }

  if (day.hasRest) {
    return "bg-purple-500 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.45)_0_2px,transparent_2px_5px)] ring-1 ring-purple-500/40 dark:bg-purple-400"
  }

  if (day.isToday) {
    return "border border-dashed border-primary/70 bg-primary/10"
  }

  return "border border-border/60 bg-muted/60"
}

function DaySignal({ day }: { day: GlobalHeatmapDay }) {
  if (day.isFuture) return null

  if (day.primaryEnergy === "HIGH") {
    return (
      <Icons.star
        aria-hidden="true"
        className="h-2.5 w-2.5 fill-current text-white"
      />
    )
  }

  if (day.primaryEnergy === "LOW") {
    return (
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-amber-950/80 dark:bg-amber-950"
      />
    )
  }

  return null
}

function getSignal(day: GlobalHeatmapDay) {
  if (day.isFuture) return "upcoming"
  if (day.primaryEnergy === "HIGH") return "high"
  if (day.primaryEnergy === "LOW") return "low"
  if (day.totalCount > 0) return "normal"
  if (day.hasRest) return "rest"
  return "empty"
}

export function GlobalActivityHeatmap({
  days,
  defaultWindowWeeks = 4,
  effectiveSpanDays = 0,
}: GlobalActivityHeatmapProps) {
  const { dict, locale, format } = useI18n()
  const heatmapDict = dict.insights.activityHistory.heatmap
  const [windowWeeks, setWindowWeeks] = React.useState<4 | 8 | 16>(
    defaultWindowWeeks
  )
  const [activeIndex, setActiveIndex] = React.useState(0)
  const dayButtonRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  const visibleDayCount = windowWeeks * 7
  const visibleDays = days.slice(-visibleDayCount)
  const numColumns = windowWeeks

  React.useEffect(() => {
    setActiveIndex((index) =>
      visibleDays.length === 0 ? 0 : Math.min(index, visibleDays.length - 1)
    )
  }, [visibleDays.length, windowWeeks])

  React.useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return
    scrollContainer.scrollLeft = scrollContainer.scrollWidth
  }, [windowWeeks, visibleDays.length])

  const columnMonths: Array<{ colIndex: number; label: string }> = []
  let lastMonth = ""

  for (let col = 0; col < numColumns; col++) {
    const mondayOfDay = visibleDays[col * 7]
    if (!mondayOfDay) continue
    const dateObj = new Date(`${mondayOfDay.dateStr}T12:00:00Z`)
    const monthName =
      locale === "zh"
        ? `${dateObj.getUTCMonth() + 1}月`
        : dateObj.toLocaleString("en-US", {
            month: "short",
            timeZone: "UTC",
          })

    if (col === numColumns - 1) {
      columnMonths.push({
        colIndex: col,
        label: heatmapDict.currentWeek,
      })
    } else if (monthName !== lastMonth) {
      columnMonths.push({ colIndex: col, label: monthName })
      lastMonth = monthName
    }
  }

  const yLabels = locale === "zh" ? Y_AXIS_ZH : Y_AXIS_EN

  const getActionName = (action: GlobalHeatmapDay["actions"][number]) => {
    if (action.status === "REST") {
      return `${action.title} (${heatmapDict.actionStatusRest})`
    }
    return action.title
  }

  const getActionStatus = (
    status: GlobalHeatmapDay["actions"][number]["status"]
  ) => {
    switch (status) {
      case "KEPT":
        return heatmapDict.actionStatusKept
      case "LAPSED":
        return heatmapDict.actionStatusLapsed
      case "REST":
        return heatmapDict.actionStatusRest
      case "SKIPPED":
        return heatmapDict.actionStatusSkipped
      default:
        return heatmapDict.actionStatusCompleted
    }
  }

  const getDayStatus = (day: GlobalHeatmapDay) => {
    if (day.isFuture) return heatmapDict.statusUpcoming
    if (day.totalCount > 0) {
      const energyLabel =
        day.primaryEnergy === "HIGH"
          ? heatmapDict.legendHigh
          : day.primaryEnergy === "LOW"
            ? heatmapDict.legendLow
            : heatmapDict.legendNormal
      return `${energyLabel} · ${format(heatmapDict.actionsCount, {
        count: day.totalCount,
      })}`
    }
    if (day.hasRest) return heatmapDict.legendRest
    if (day.isToday) return heatmapDict.todayPending
    return heatmapDict.legendEmpty
  }

  const getActionList = (day: GlobalHeatmapDay) => {
    if (day.actions.length > 0) {
      return day.actions.map(getActionName).join(locale === "zh" ? "、" : ", ")
    }
    if (day.hasRest) return heatmapDict.restRecord
    return heatmapDict.noActions
  }

  const getDayAriaLabel = (day: GlobalHeatmapDay) =>
    `${day.dateStr} · ${getDayStatus(day)} · ${getActionList(day)}`

  const handleDayKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const offsets: Partial<Record<string, number>> = {
      ArrowUp: -1,
      ArrowDown: 1,
      ArrowLeft: -7,
      ArrowRight: 7,
    }
    let nextIndex: number | null = null

    if (event.key in offsets) {
      nextIndex = Math.max(
        0,
        Math.min(visibleDays.length - 1, index + offsets[event.key]!)
      )
    } else if (event.key === "Home") {
      nextIndex = 0
    } else if (event.key === "End") {
      nextIndex = visibleDays.length - 1
    }

    if (nextIndex === null) return
    event.preventDefault()
    setActiveIndex(nextIndex)
    dayButtonRefs.current[nextIndex]?.focus()
  }

  return (
    <Card className="min-w-0 max-w-full overflow-hidden shadow-xs space-y-4 border-border/80 p-4 md:p-6">
      <CardHeader className="flex flex-col justify-between gap-3 p-0 sm:flex-row sm:items-center">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Icons.calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {heatmapDict.title}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {heatmapDict.description}
          </CardDescription>
        </div>

        <div
          role="group"
          aria-label={heatmapDict.rangeLabel}
          className="flex items-center gap-1 self-start rounded-lg bg-muted/60 p-1 sm:self-auto"
        >
          {([4, 8, 16] as const).map((weeks) => (
            <button
              key={weeks}
              type="button"
              onClick={() => setWindowWeeks(weeks)}
              aria-pressed={windowWeeks === weeks}
              className={cn(
                "min-h-11 min-w-11 rounded-md px-2.5 py-1 text-xs font-semibold transition-[background-color,color,transform] duration-150 active:scale-95 motion-reduce:transform-none",
                windowWeeks === weeks
                  ? "shadow-xs bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {weeks === 4
                ? heatmapDict.range4
                : weeks === 8
                  ? heatmapDict.range8
                  : heatmapDict.range16}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="min-w-0 max-w-full space-y-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {(
              [
                ["HIGH", heatmapDict.legendHigh],
                ["NORMAL", heatmapDict.legendNormal],
                ["LOW", heatmapDict.legendLow],
                ["REST", heatmapDict.legendRest],
                ["EMPTY", heatmapDict.legendEmpty],
              ] as const
            ).map(([state, label]) => (
              <div key={state} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-xs flex h-3.5 w-3.5 items-center justify-center",
                    state === "HIGH" &&
                      "bg-emerald-700 text-white dark:bg-emerald-500",
                    state === "NORMAL" && "bg-emerald-500 dark:bg-emerald-400",
                    state === "LOW" && "bg-amber-500 dark:bg-amber-400",
                    state === "REST" &&
                      "bg-purple-500 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.45)_0_2px,transparent_2px_5px)] text-white dark:bg-purple-400",
                    state === "EMPTY" && "border border-border bg-muted/60"
                  )}
                  aria-hidden="true"
                >
                  {state === "HIGH" && (
                    <Icons.star className="h-2 w-2 fill-current" />
                  )}
                  {state === "LOW" && (
                    <span className="h-1 w-1 rounded-full bg-amber-950/80" />
                  )}

                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <span className="text-[10px] text-muted-foreground/80">
            {heatmapDict.calendarWeeks}
          </span>
        </div>

        <div
          ref={scrollRef}
          data-testid="activity-heatmap-scroll"
          className="min-w-0 max-w-full overflow-x-auto pb-1"
        >
          <div className="inline-block min-w-full">
            <div
              className="mb-1 grid gap-1 pl-6 text-[10px] font-medium text-muted-foreground/80"
              style={{
                gridTemplateColumns: `repeat(${numColumns}, 32px)`,
              }}
            >
              {Array.from({ length: numColumns }).map((_, colIdx) => {
                const marker = columnMonths.find(
                  (month) => month.colIndex === colIdx
                )
                return (
                  <div key={colIdx} className="truncate text-center">
                    {marker ? marker.label : ""}
                  </div>
                )
              })}
            </div>

            <div className="flex items-start gap-2">
              <div className="sticky left-0 z-10 grid grid-rows-7 gap-1 bg-card pt-2 text-[9px] font-medium text-muted-foreground/75">
                {yLabels.map((label, index) => (
                  <div
                    key={index}
                    className="flex h-8 w-4 items-center justify-center"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div
                role="group"
                aria-label={heatmapDict.gridLabel}
                className="grid grid-flow-col grid-rows-7 gap-1"
                style={{
                  gridTemplateColumns: `repeat(${numColumns}, 32px)`,
                }}
              >
                {visibleDays.map((day, index) => {
                  const ariaLabel = getDayAriaLabel(day)
                  return (
                    <Popover key={day.dateStr}>
                      <PopoverTrigger asChild>
                        <button
                          ref={(node) => {
                            dayButtonRefs.current[index] = node
                          }}
                          type="button"
                          tabIndex={index === activeIndex ? 0 : -1}
                          aria-label={ariaLabel}
                          aria-current={day.isToday ? "date" : undefined}
                          title={ariaLabel}
                          onFocus={() => setActiveIndex(index)}
                          onKeyDown={(event) => handleDayKeyDown(event, index)}
                          className="group flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <span
                            aria-hidden="true"
                            data-signal={getSignal(day)}
                            className={cn(
                              "rounded-xs flex h-6 w-6 items-center justify-center transition-transform duration-150 group-hover:scale-110 group-active:scale-95 motion-reduce:transform-none",
                              getColorClass(day),
                              day.isToday &&
                                "outline outline-1 outline-offset-1 outline-primary/50"
                            )}
                          >
                            <DaySignal day={day} />
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-72 max-w-[calc(100vw-2rem)] space-y-3 text-xs"
                        side="top"
                        align="center"
                        aria-label={ariaLabel}
                      >
                        <div className="flex items-start justify-between gap-3 border-b pb-2">
                          <div>
                            <p className="font-semibold text-foreground">
                              {day.dateStr}
                            </p>
                            <p className="mt-0.5 text-muted-foreground">
                              {getDayStatus(day)}
                            </p>
                          </div>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "rounded-xs flex h-6 w-6 shrink-0 items-center justify-center",
                              getColorClass(day)
                            )}
                          >
                            <DaySignal day={day} />
                          </span>
                        </div>

                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {heatmapDict.actionsLabel}
                          </p>
                          {day.actions.length > 0 ? (
                            <ul className="space-y-1.5">
                              {day.actions.map((action, actionIndex) => (
                                <li
                                  key={`${action.title}-${actionIndex}`}
                                  className="flex items-start justify-between gap-3 rounded-md bg-muted/40 px-2 py-1.5"
                                >
                                  <span className="min-w-0 break-words font-medium text-foreground">
                                    {action.title}
                                  </span>
                                  <span className="shrink-0 text-[10px] text-muted-foreground">
                                    {getActionStatus(action.status)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground">
                              {day.hasRest
                                ? heatmapDict.restRecord
                                : heatmapDict.noActions}
                            </p>
                          )}
                        </div>

                        {day.hasRest && day.totalCount > 0 && (
                          <p className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-1.5 text-purple-700 dark:text-purple-300">
                            {heatmapDict.restAlsoRecorded}
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

        {effectiveSpanDays <= 7 && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/30 p-2.5 text-center text-xs text-muted-foreground">
            <Icons.sparkles
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0"
            />
            <p>{heatmapDict.sparseHint}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
