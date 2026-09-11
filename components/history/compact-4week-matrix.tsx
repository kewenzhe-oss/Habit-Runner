"use client"

import * as React from "react"

import type { GlobalHeatmapDay } from "@/lib/api/history"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Icons } from "@/components/icons"

interface Compact4WeekMatrixProps {
  days: GlobalHeatmapDay[]
}

const Y_AXIS_ZH = ["一", "二", "三", "四", "五", "六", "日"]
const Y_AXIS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function Compact4WeekMatrix({ days }: Compact4WeekMatrixProps) {
  const { dict, locale } = useI18n()
  const actDict = dict.insights.activityHistory
  const formingDict = actDict.forming || {}
  const heatmapDict = actDict.heatmap || {}

  // Take the last 28 days (4 full natural weeks)
  const visibleDays = days.slice(-28)
  const weeks = Array.from({ length: 4 }, (_, index) =>
    visibleDays.slice(index * 7, index * 7 + 7)
  )
  const elapsedDays = visibleDays.filter((day) => !day.isFuture)
  const connected = (day: GlobalHeatmapDay) => day.totalCount > 0 || day.hasRest
  const recordedDays = elapsedDays.filter(
    (day) => day.actions.length > 0 || connected(day)
  ).length
  const connectedWeeks = weeks.filter((week) =>
    week.some((day) => !day.isFuture && connected(day))
  ).length
  const completedActions = elapsedDays.reduce(
    (sum, day) => sum + day.totalCount,
    0
  )
  const zh = locale === "zh"

  const columnLabels = [
    locale === "zh" ? "3周前" : "3w ago",
    locale === "zh" ? "2周前" : "2w ago",
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
      return "border border-dashed border-primary/70 bg-primary/10"
    }
    return "bg-muted/50 border border-border/40"
  }

  const yLabels = locale === "zh" ? Y_AXIS_ZH : Y_AXIS_EN

  return (
    <Card className="shadow-xs space-y-4 border-border/80 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Icons.calendar className="h-4 w-4 text-muted-foreground/60" />
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {formingDict.title ||
                (locale === "zh" ? "近 4 周日常节律" : "4-Week Rhythm Matrix")}
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
            <span className="rounded-xs h-2.5 w-2.5 bg-emerald-600 dark:bg-emerald-500" />
            <span>
              {heatmapDict.legendHigh || (locale === "zh" ? "充沛" : "High")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-xs h-2.5 w-2.5 bg-emerald-500 dark:bg-emerald-400" />
            <span>
              {heatmapDict.legendNormal || (locale === "zh" ? "完成" : "Done")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-xs h-2.5 w-2.5 bg-amber-500 dark:bg-amber-400" />
            <span>
              {heatmapDict.legendLow || (locale === "zh" ? "微行动" : "Micro")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-xs h-2.5 w-2.5 bg-purple-500 dark:bg-purple-400" />
            <span>
              {heatmapDict.legendRest || (locale === "zh" ? "休整" : "Rest")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-xs h-2.5 w-2.5 border border-border bg-muted/50" />
            <span>
              {heatmapDict.legendEmpty ||
                (locale === "zh" ? "未记录" : "No record")}
            </span>
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground/75">
          {locale === "zh"
            ? "自然周（周一至周日）"
            : "Calendar weeks (Mon-Sun)"}
        </span>
      </div>

      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="min-w-0">
          <table className="w-full table-fixed border-separate [border-spacing:0.375rem]">
            <caption className="sr-only">{formingDict.title}</caption>
            <thead>
              <tr>
                <td className="w-6" />
                {columnLabels.map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="pb-2 text-center text-[11px] font-medium text-muted-foreground"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yLabels.map((label, row) => (
                <tr key={row}>
                  <th
                    scope="row"
                    className="text-[10px] font-normal text-muted-foreground"
                  >
                    {label}
                  </th>
                  {weeks.map((week, column) => {
                    const day = week[row]
                    if (!day) return <td key={column} />
                    const status = day.isFuture
                      ? zh
                        ? "尚未到来"
                        : "Upcoming"
                      : day.totalCount > 0
                        ? zh
                          ? `${day.totalCount} 次完成`
                          : `${day.totalCount} completed actions`
                        : day.hasRest
                          ? zh
                            ? "主动休整"
                            : "Intentional rest"
                          : day.actions.length > 0
                            ? zh
                              ? "已留下觉察记录"
                              : "Reflection recorded"
                            : zh
                              ? "尚无记录"
                              : "No record yet"
                    const description = `${day.dateStr} · ${status}`
                    return (
                      <td key={day.dateStr} className="p-0">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              title={description}
                              aria-label={description}
                              aria-current={day.isToday ? "date" : undefined}
                              className="group mx-auto flex h-11 w-full max-w-14 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "block h-9 w-full max-w-12 rounded-sm transition-transform duration-150 group-hover:scale-105 motion-reduce:transform-none",
                                  getColorClass(day)
                                )}
                              />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="max-h-64 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto text-xs"
                            aria-label={description}
                          >
                            <p className="font-semibold">{day.dateStr}</p>
                            <p className="mt-1 text-muted-foreground">
                              {status}
                            </p>
                            {day.hasRest && day.totalCount > 0 && (
                              <p className="mt-1 text-muted-foreground">
                                {zh
                                  ? "也留下了休整记录"
                                  : "Rest was also recorded"}
                              </p>
                            )}
                            {day.actions.length > 0 && (
                              <ul className="mt-3 space-y-2">
                                {day.actions.map((action, index) => (
                                  <li key={index} className="break-words">
                                    {action.title} ·{" "}
                                    {
                                      {
                                        COMPLETED: zh ? "完成" : "Completed",
                                        KEPT: zh ? "保持" : "Kept",
                                        REST: zh ? "休整" : "Rest",
                                        LAPSED: zh
                                          ? "记录发生"
                                          : "Occurrence recorded",
                                        SKIPPED: zh ? "跳过" : "Skipped",
                                      }[action.status]
                                    }
                                  </li>
                                ))}
                              </ul>
                            )}
                          </PopoverContent>
                        </Popover>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="border-t pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="mb-4 text-xs font-medium text-muted-foreground">
            {zh ? "这四周留下的痕迹" : "Traces from these four weeks"}
          </p>
          <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-6">
            {[
              [zh ? "有记录的天" : "Days recorded", recordedDays],
              [zh ? "留下连接的周" : "Weeks connected", connectedWeeks],
              [
                zh ? "完成与保持" : "Actions completed or kept",
                completedActions,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] leading-relaxed text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {zh
              ? "休整也算连接；本周仍在继续。"
              : "Rest counts as connection. This week is still unfolding."}
          </p>
        </aside>
      </div>
    </Card>
  )
}
