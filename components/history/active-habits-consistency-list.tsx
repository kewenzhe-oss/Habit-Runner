"use client"

import * as React from "react"
import Link from "next/link"
import { HistoryItemSummary } from "@/lib/api/history"
import { useI18n } from "@/lib/i18n"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

interface ActiveHabitsConsistencyListProps {
  items: HistoryItemSummary[]
}

const WEEKDAY_SHORT_ZH = ["一", "二", "三", "四", "五", "六", "日"]
const WEEKDAY_SHORT_EN = ["M", "T", "W", "T", "F", "S", "S"]

function ThisWeekTraceBar({
  days,
  locale,
}: {
  days: HistoryItemSummary["recent7Days"]
  locale: string
}) {
  if (!days || days.length === 0) return null
  const labels = locale === "zh" ? WEEKDAY_SHORT_ZH : WEEKDAY_SHORT_EN

  return (
    <div className="flex items-center gap-1.5" aria-label="This week trace">
      {days.map((day, idx) => {
        const isToday = Boolean(day.isToday)
        const isFuture = Boolean(day.isFuture)
        const label = labels[idx] || ""

        let dotClass = "bg-muted-foreground/20"
        let statusTitle = `${day.date} (${label})`

        if (day.status === "COMPLETED" || day.status === "KEPT") {
          dotClass =
            day.actualEnergy === "HIGH"
              ? "bg-emerald-500"
              : day.actualEnergy === "LOW"
                ? "bg-amber-400"
                : "bg-emerald-500"
          statusTitle += `: ${locale === "zh" ? "已完成" : "Done"}`
        } else if (day.status === "REST") {
          dotClass = "bg-muted-foreground/35"
          statusTitle += `: ${locale === "zh" ? "休整" : "Rest"}`
        } else if (day.status === "LAPSED") {
          dotClass = "bg-orange-400/60"
          statusTitle += `: ${locale === "zh" ? "中断" : "Lapsed"}`
        } else if (isToday) {
          dotClass =
            "border border-dashed border-primary/70 bg-primary/10 animate-pulse"
          statusTitle += `: ${locale === "zh" ? "今日待打卡" : "Today pending"}`
        } else if (isFuture) {
          dotClass = "border border-dashed border-muted-foreground/20"
          statusTitle += `: ${locale === "zh" ? "未到来" : "Upcoming"}`
        }

        return (
          <div
            key={day.date}
            title={statusTitle}
            className="flex flex-col items-center gap-0.5"
          >
            <span
              className={cn(
                "text-[8px] leading-none",
                isToday
                  ? "font-bold text-primary"
                  : isFuture
                    ? "text-muted-foreground/30"
                    : "text-muted-foreground/50"
              )}
            >
              {label}
            </span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all",
                dotClass,
                isToday && "h-2 w-2"
              )}
            />
          </div>
        )
      })}
    </div>
  )
}

export function ActiveHabitsConsistencyList({
  items,
}: ActiveHabitsConsistencyListProps) {
  const { dict, locale, format } = useI18n()
  const listDict = dict.insights.activityHistory.activeItems

  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Icons.fire className="h-4 w-4 text-amber-500/80" />
          <h2 className="text-sm font-semibold text-foreground">
            {listDict.title}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">{listDict.description}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-8 text-center text-xs text-muted-foreground">
          <p>{listDict.empty}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40 rounded-xl border border-border/50 bg-card">
          {items.map((item) => {
            const streakCount =
              item.type === "QUIT_HABIT"
                ? item.maintainedDays
                : item.rhythmStreak

            return (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="group flex flex-col justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center"
              >
                {/* Left: Color Bar + Title */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className="h-6 w-0.5 shrink-0 rounded-full opacity-60 transition-opacity group-hover:opacity-90"
                    style={{ backgroundColor: item.colorCode || "#10B981" }}
                  />

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {item.title}
                      </span>
                      {item.type !== "TODO" && streakCount > 0 && (
                        <span className="text-[11px] text-muted-foreground/60">
                          {streakCount}
                          {locale === "zh" ? "天" : "d"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/70">
                      {format(listDict.totalCompleted, {
                        count: item.totalCompletedCount,
                      })}
                    </p>
                  </div>
                </div>

                {/* Right: 7-Day Mini Dots + Arrow */}
                <div className="flex shrink-0 items-center gap-3 text-xs sm:gap-4">
                  {item.type !== "TODO" && (
                    <ThisWeekTraceBar days={item.recent7Days} locale={locale} />
                  )}

                  <Icons.next className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
