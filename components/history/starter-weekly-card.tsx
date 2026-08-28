"use client"

import * as React from "react"
import { GlobalHeatmapDay, RecentActionRecord } from "@/lib/api/history"
import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

interface StarterWeeklyCardProps {
  thisWeekDays: GlobalHeatmapDay[]
  recentActions: RecentActionRecord[]
}

const WEEKDAY_NAMES_ZH = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
const WEEKDAY_NAMES_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function StarterWeeklyCard({
  thisWeekDays,
  recentActions,
}: StarterWeeklyCardProps) {
  const { dict, format, locale } = useI18n()
  const starterDict = (dict.insights as any)?.activityHistory?.starter || {}
  const labels = locale === "zh" ? WEEKDAY_NAMES_ZH : WEEKDAY_NAMES_EN

  const getDayStatusDisplay = (day: GlobalHeatmapDay, isToday: boolean, isFuture: boolean) => {
    if (isFuture) {
      return {
        bgClass: "border border-dashed border-muted-foreground/30 bg-muted/10 text-muted-foreground/40",
        label: locale === "zh" ? "未到来" : "Upcoming",
        icon: null,
      }
    }
    if (day.totalCount > 0) {
      if (day.primaryEnergy === "HIGH") {
        return {
          bgClass: "bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs",
          label: locale === "zh" ? "充沛完成" : "High Energy",
          icon: "⚡",
        }
      }
      if (day.primaryEnergy === "LOW") {
        return {
          bgClass: "bg-amber-500 dark:bg-amber-400 text-white shadow-xs",
          label: locale === "zh" ? "微行动" : "Micro Action",
          icon: "🌱",
        }
      }
      return {
        bgClass: "bg-emerald-500 dark:bg-emerald-400 text-white shadow-xs",
        label: locale === "zh" ? "已完成" : "Completed",
        icon: "✓",
      }
    }
    if (day.hasRest) {
      return {
        bgClass: "bg-purple-500 dark:bg-purple-400 text-white shadow-xs",
        label: locale === "zh" ? "主动休整" : "Rest",
        icon: "☕",
      }
    }
    if (isToday) {
      return {
        bgClass: "border border-dashed border-primary bg-primary/10 text-primary font-bold animate-pulse",
        label: locale === "zh" ? "今日待办" : "Pending",
        icon: "○",
      }
    }
    return {
      bgClass: "bg-muted/40 border border-border/50 text-muted-foreground/60",
      label: starterDict.statusNone || (locale === "zh" ? "未记录" : "No record"),
      icon: null,
    }
  }

  return (
    <Card className="space-y-5 border-border/80 p-4 shadow-xs md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Icons.check className="h-4 w-4 text-muted-foreground/60" />
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {starterDict.title || (locale === "zh" ? "本周生活节律" : "This Week Rhythm")}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {starterDict.subtitle ||
              (locale === "zh"
                ? "专注看见这几天的真实发生与生活节奏"
                : "Focus on your daily rhythm and actions this week")}
          </CardDescription>
        </div>
      </div>

      {/* Main 7-Day Big Rhythm Bar */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {thisWeekDays.map((day, idx) => {
          const isToday = Boolean(day.isToday)
          const isFuture = Boolean(day.isFuture)
          const weekdayLabel = labels[idx] || ""
          const datePart = day.dateStr.slice(5) // MM-DD
          const display = getDayStatusDisplay(day, isToday, isFuture)

          return (
            <div
              key={day.dateStr}
              className={cn(
                "flex flex-col items-center justify-between rounded-lg p-2 text-center transition-all sm:p-2.5",
                isToday
                  ? "bg-primary/5 ring-1.5 ring-primary/40"
                  : "bg-muted/25 hover:bg-muted/40"
              )}
            >
              {/* Day of Week + Date */}
              <div className="space-y-0.5">
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {weekdayLabel}
                </span>
                <p className="text-[9px] text-muted-foreground/60">{datePart}</p>
              </div>

              {/* Status Pill */}
              <div
                className={cn(
                  "mt-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-transform sm:h-9 sm:w-9",
                  display.bgClass
                )}
                title={`${day.dateStr}: ${display.label}`}
              >
                {display.icon ? <span>{display.icon}</span> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />}
              </div>

              {/* Status Text Label */}
              <span className="mt-1.5 truncate text-[10px] font-medium text-muted-foreground/80">
                {display.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Recent Action Stream */}
      {recentActions.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>{starterDict.recentTitle || (locale === "zh" ? "最近打卡记录" : "Recent Check-ins")}</span>
            <span className="text-[10px] font-normal text-muted-foreground">
              {format(starterDict.recentSubtext || (locale === "zh" ? "近 {count} 笔行动" : "Latest {count} events"), {
                count: recentActions.length,
              })}
            </span>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2">
            {recentActions.map((action) => {
              const dow = locale === "zh" ? action.dayOfWeekZh : action.dayOfWeekEn
              return (
                <div
                  key={action.id}
                  className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        action.status === "REST"
                          ? "bg-purple-500"
                          : action.actualEnergy === "HIGH"
                            ? "bg-emerald-600"
                            : action.actualEnergy === "LOW"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                      )}
                    />
                    <span className="truncate font-medium text-foreground">
                      {action.title}
                    </span>
                  </div>

                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {dow} ({action.date.slice(5)})
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Encouraging Gentle Prompt */}
      <div className="rounded-lg bg-emerald-500/5 p-2.5 text-center text-xs font-medium text-emerald-800 dark:text-emerald-300">
        <p>
          {starterDict.hint ||
            (locale === "zh"
              ? "🌱 本周记录正在沉淀，每一天的真实行动都算数。"
              : "🌱 Your rhythm is taking root this week. Every action counts.")}
        </p>
      </div>
    </Card>
  )
}
