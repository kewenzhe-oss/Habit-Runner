"use client"

import * as React from "react"
import { GlobalHeatmapDay } from "@/lib/api/history"
import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

interface Compact4WeekMatrixProps {
  days: GlobalHeatmapDay[]
}

const Y_AXIS_ZH = ["一", "", "三", "", "五", "", "日"]
const Y_AXIS_EN = ["M", "", "W", "", "F", "", "S"]

export function Compact4WeekMatrix({ days }: Compact4WeekMatrixProps) {
  const { dict, locale } = useI18n()
  const actDict = (dict.insights as any)?.activityHistory || {}
  const formingDict = actDict.forming || {}
  const heatmapDict = actDict.heatmap || {}

  // Take the last 28 days (4 full natural weeks)
  const visibleDays = days.slice(-28)
  const numColumns = 4

  const columnLabels = [
    locale === "zh" ? "3周前" : "3w ago",
    locale === "zh" ? "前周" : "2w ago",
    locale === "zh" ? "上周" : "Last week",
    locale === "zh" ? "本周" : "This week",
  ]

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Icons.calendar className="h-4 w-4 text-muted-foreground/60" />
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {formingDict.title || (locale === "zh" ? "近 4 周日常节律" : "4-Week Rhythm Matrix")}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {formingDict.subtitle ||
              (locale === "zh"
                ? "观察跨周节律与稳固过程"
                : "Observe cross-week habit rhythm")}
          </CardDescription>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
            <span>{heatmapDict.legendHigh || (locale === "zh" ? "充沛" : "High")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-400" />
            <span>{heatmapDict.legendNormal || (locale === "zh" ? "完成" : "Done")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-amber-500 dark:bg-amber-400" />
            <span>{heatmapDict.legendLow || (locale === "zh" ? "微行动" : "Micro")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-purple-500 dark:bg-purple-400" />
            <span>{heatmapDict.legendRest || (locale === "zh" ? "休整" : "Rest")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs border border-border bg-muted/50" />
            <span>{heatmapDict.legendEmpty || (locale === "zh" ? "未记录" : "No record")}</span>
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground/75">
          {locale === "zh" ? "自然周（周一至周日）" : "Calendar weeks (Mon-Sun)"}
        </span>
      </div>

      {/* 4-Week Grid with Coordinates */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          {/* Week column headers */}
          <div
            className="mb-1.5 grid gap-2 pl-6 text-[11px] font-medium text-muted-foreground/80"
            style={{
              gridTemplateColumns: `repeat(${numColumns}, 28px)`,
            }}
          >
            {columnLabels.map((lbl, idx) => (
              <div key={idx} className="truncate text-center">
                {lbl}
              </div>
            ))}
          </div>

          {/* Body: Y-axis + 4x7 Grid */}
          <div className="flex items-start gap-2">
            {/* Y-axis Weekday labels */}
            <div className="grid grid-rows-7 gap-2 pt-0.5 text-[9px] font-medium text-muted-foreground/70">
              {yLabels.map((lbl, i) => (
                <div key={i} className="flex h-7 w-4 items-center justify-center">
                  {lbl}
                </div>
              ))}
            </div>

            {/* Grid of days */}
            <div
              className="grid grid-flow-col grid-rows-7 gap-2"
              style={{
                gridTemplateColumns: `repeat(${numColumns}, 28px)`,
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
                          ? locale === "zh"
                            ? "今日待办"
                            : "Pending"
                          : locale === "zh"
                            ? "未记录"
                            : "No record"
                }`

                return (
                  <div
                    key={day.dateStr}
                    title={tooltipText}
                    className={cn(
                      "h-7 w-7 cursor-pointer rounded-sm transition-transform hover:scale-115",
                      getColorClass(day)
                    )}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
