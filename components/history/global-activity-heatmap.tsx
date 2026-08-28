"use client"

import * as React from "react"
import { GlobalHeatmapDay } from "@/lib/api/history"
import { useI18n, formatLocalizedDate } from "@/lib/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

interface GlobalActivityHeatmapProps {
  days: GlobalHeatmapDay[]
  defaultWindowWeeks?: 4 | 8 | 16
  effectiveSpanDays?: number
}

const Y_AXIS_ZH = ["一", "", "三", "", "五", "", "日"]
const Y_AXIS_EN = ["M", "", "W", "", "F", "", "S"]

export function GlobalActivityHeatmap({
  days,
  defaultWindowWeeks = 4,
  effectiveSpanDays = 0,
}: GlobalActivityHeatmapProps) {
  const { dict, locale } = useI18n()
  const heatmapDict = dict.insights.activityHistory.heatmap
  const [windowWeeks, setWindowWeeks] = React.useState<4 | 8 | 16>(
    defaultWindowWeeks
  )

  // Slice days based on selected window
  const visibleDayCount = windowWeeks * 7
  const visibleDays = days.slice(-visibleDayCount)
  const numColumns = windowWeeks

  // Helper to compute month markers for the columns
  const columnMonths: Array<{ colIndex: number; label: string }> = []
  let lastMonth = ""

  for (let col = 0; col < numColumns; col++) {
    const mondayOfDay = visibleDays[col * 7]
    if (!mondayOfDay) continue
    const dateObj = new Date(mondayOfDay.dateStr)
    const monthName = locale === "zh"
      ? `${dateObj.getMonth() + 1}月`
      : dateObj.toLocaleString("en-US", { month: "short" })

    // If last column (current week), or month changed
    if (col === numColumns - 1) {
      columnMonths.push({
        colIndex: col,
        label: locale === "zh" ? "本周" : "Now",
      })
    } else if (monthName !== lastMonth) {
      columnMonths.push({ colIndex: col, label: monthName })
      lastMonth = monthName
    }
  }

  const getColorClass = (day: GlobalHeatmapDay) => {
    if (day.isFuture) {
      return "border border-dashed border-muted-foreground/20 bg-transparent"
    }

    if (day.totalCount > 0) {
      if (day.primaryEnergy === "HIGH") {
        return "bg-emerald-600 dark:bg-emerald-500 ring-1 ring-emerald-500/40"
      }
      if (day.primaryEnergy === "LOW") {
        return "bg-amber-500 dark:bg-amber-400 ring-1 ring-amber-500/40"
      }
      return "bg-emerald-500 dark:bg-emerald-400 ring-1 ring-emerald-500/30"
    }

    if (day.hasRest) {
      return "bg-purple-500 dark:bg-purple-400 ring-1 ring-purple-500/30"
    }

    if (day.isToday) {
      return "border border-dashed border-primary/70 bg-primary/10 animate-pulse"
    }

    return "bg-muted/50 border border-border/40"
  }

  const yLabels = locale === "zh" ? Y_AXIS_ZH : Y_AXIS_EN

  return (
    <Card className="space-y-4 border-border/80 p-4 shadow-xs md:p-6">
      {/* Header & Window Controls */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Icons.calendar className="h-4 w-4 text-muted-foreground/60" />
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {heatmapDict.title}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {heatmapDict.description}
          </CardDescription>
        </div>

        {/* Window Switcher (4 Weeks / 8 Weeks / 16 Weeks) */}
        <div className="flex items-center gap-1 self-start rounded-lg bg-muted/60 p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => setWindowWeeks(4)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              windowWeeks === 4
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {locale === "zh" ? "近4周" : "4W"}
          </button>
          <button
            type="button"
            onClick={() => setWindowWeeks(8)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              windowWeeks === 8
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {locale === "zh" ? "近8周" : "8W"}
          </button>
          <button
            type="button"
            onClick={() => setWindowWeeks(16)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              windowWeeks === 16
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {locale === "zh" ? "近16周" : "16W"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
            <span>{heatmapDict.legendHigh}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-400" />
            <span>{heatmapDict.legendNormal}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-amber-500 dark:bg-amber-400" />
            <span>{heatmapDict.legendLow}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-purple-500 dark:bg-purple-400" />
            <span>{heatmapDict.legendRest}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs border border-border bg-muted/50" />
            <span>{heatmapDict.legendEmpty}</span>
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground/75">
          {locale === "zh" ? "自然周（周一至周日）" : "Calendar weeks (Mon-Sun)"}
        </span>
      </div>

      {/* Heatmap Matrix with X & Y Coordinates */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          {/* Month labels along X-axis */}
          <div
            className="mb-1 grid gap-1.5 pl-6 text-[10px] font-medium text-muted-foreground/75"
            style={{
              gridTemplateColumns: `repeat(${numColumns}, 16px)`,
            }}
          >
            {Array.from({ length: numColumns }).map((_, colIdx) => {
              const marker = columnMonths.find((m) => m.colIndex === colIdx)
              return (
                <div key={colIdx} className="truncate text-center">
                  {marker ? marker.label : ""}
                </div>
              )
            })}
          </div>

          {/* Body: Y-axis + 7xN Grid */}
          <div className="flex items-start gap-2">
            {/* Y-axis Weekday labels */}
            <div className="grid grid-rows-7 gap-1.5 pt-0.5 text-[9px] font-medium text-muted-foreground/70">
              {yLabels.map((lbl, i) => (
                <div key={i} className="flex h-4 w-4 items-center justify-center">
                  {lbl}
                </div>
              ))}
            </div>

            {/* Grid of days */}
            <div
              className="grid grid-flow-col grid-rows-7 gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${numColumns}, 16px)`,
              }}
            >
              {visibleDays.map((day) => {
                const actionNames = day.actions
                  .map(
                    (a) => `${a.title}${a.status === "REST" ? " (休整)" : ""}`
                  )
                  .join("、")

                const tooltipText = `${day.dateStr}: ${
                  day.isFuture
                    ? locale === "zh"
                      ? "未来（未到来）"
                      : "Upcoming"
                    : day.totalCount > 0
                      ? `${day.totalCount} ${
                          locale === "zh" ? "次完成" : "actions"
                        }${actionNames ? ` (${actionNames})` : ""}`
                      : day.hasRest
                        ? locale === "zh"
                          ? "主动休整"
                          : "Rest day"
                        : day.isToday
                          ? heatmapDict.todayPending
                          : heatmapDict.legendEmpty
                }`

                return (
                  <div
                    key={day.dateStr}
                    title={tooltipText}
                    className={cn(
                      "h-4 w-4 cursor-pointer rounded-xs transition-transform hover:scale-125",
                      getColorClass(day)
                    )}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sparse data gentle encouraging hint */}
      {effectiveSpanDays <= 7 && (
        <div className="rounded-lg bg-muted/30 p-2.5 text-center text-xs text-muted-foreground/80">
          <p>
            {locale === "zh"
              ? "🌱 生活节律正在从本周开始自然生长，每一天的真实记录都算数。"
              : "🌱 Your daily rhythm is taking root this week. Every single record counts."}
          </p>
        </div>
      )}
    </Card>
  )
}
