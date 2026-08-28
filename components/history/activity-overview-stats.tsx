"use client"

import * as React from "react"
import { useI18n } from "@/lib/i18n"
import { Icons } from "@/components/icons"

interface ActivityOverviewStatsProps {
  overview: {
    totalCheckIns: number
    activeDaysCount: number
    maxCurrentStreak: number
    activeHabitsCount?: number
  }
}

export function ActivityOverviewStats({ overview }: ActivityOverviewStatsProps) {
  const { dict } = useI18n()
  const statsDict = dict.insights.activityHistory.stats

  return (
    <div className="grid grid-cols-3 divide-x divide-border/40 rounded-xl border border-border/50 bg-card p-2 shadow-2xs">
      {/* 1. 累计完成行动次数 */}
      <div className="flex flex-col items-center justify-center p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
        <Icons.check className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 sm:block" />
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            {statsDict.totalCheckIns}
          </p>
          <div className="flex items-baseline justify-center gap-1 sm:justify-start">
            <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {overview.totalCheckIns}
            </span>
            <span className="text-[11px] font-normal text-muted-foreground/70">
              {statsDict.timesUnit}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 留下痕迹天数 */}
      <div className="flex flex-col items-center justify-center p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
        <Icons.calendar className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 sm:block" />
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            {statsDict.activeDays}
          </p>
          <div className="flex items-baseline justify-center gap-1 sm:justify-start">
            <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {overview.activeDaysCount}
            </span>
            <span className="text-[11px] font-normal text-muted-foreground/70">
              {statsDict.daysUnit}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 当前最高连续 */}
      <div className="flex flex-col items-center justify-center p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
        <Icons.fire className="hidden h-4 w-4 shrink-0 text-amber-500/70 sm:block" />
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            {statsDict.bestStreak}
          </p>
          <div className="flex items-baseline justify-center gap-1 sm:justify-start">
            <span className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 sm:text-2xl">
              {overview.maxCurrentStreak}
            </span>
            <span className="text-[11px] font-normal text-muted-foreground/70">
              {statsDict.daysUnit}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
