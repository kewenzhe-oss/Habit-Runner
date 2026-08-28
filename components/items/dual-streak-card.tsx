"use client"

import * as React from "react"

import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useI18n, formatLocalizedDays } from "@/lib/i18n"

interface DualStreakCardProps {
  actionStreak: number
  rhythmStreak: number
  longestActionStreak: number
  maintainedDays?: number
  type: "HABIT" | "QUIT_HABIT" | "TODO"
}

export function DualStreakCard({
  actionStreak,
  rhythmStreak,
  longestActionStreak,
  maintainedDays,
  type,
}: DualStreakCardProps) {
  const { dict: fullDict, locale } = useI18n()
  const dict = fullDict.item.streaks

  const getDaysLabel = (count: number) => {
    return locale === "zh" ? "天" : count === 1 ? "day" : "days"
  }

  if (type === "QUIT_HABIT") {
    const currentKept = maintainedDays || 0
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="space-y-1 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Icons.quitHabit className="h-3.5 w-3.5 text-emerald-500" />
            <span>{dict.currentKept}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {currentKept}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {getDaysLabel(currentKept)}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{dict.currentKeptSub}</p>
        </Card>

        <Card className="space-y-1 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Icons.sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span>{dict.rhythmTitle}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {rhythmStreak}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {getDaysLabel(rhythmStreak)}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {dict.rhythmSub}
          </p>
        </Card>
      </div>
    )
  }

  if (type === "TODO") {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* 1. Action Streak */}
      <Card className="space-y-1 border-orange-500/20 bg-orange-500/5 p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">
          <Icons.fire className="h-4 w-4" />
          <span>{dict.actionStreakTitle}</span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {actionStreak}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {getDaysLabel(actionStreak)}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {dict.actionStreakSub}
        </p>
      </Card>

      {/* 2. Rhythm Continuity */}
      <Card className="space-y-1 border-purple-500/20 bg-purple-500/5 p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          <Icons.sparkles className="h-4 w-4" />
          <span>{dict.rhythmStreakTitle}</span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {rhythmStreak}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {getDaysLabel(rhythmStreak)}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {dict.rhythmStreakSub}
        </p>
      </Card>

      {/* 3. Longest Streak */}
      <Card className="space-y-1 p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Icons.star className="h-4 w-4 text-amber-500" />
          <span>{dict.longestStreakTitle}</span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {longestActionStreak}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {getDaysLabel(longestActionStreak)}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {dict.longestStreakSub}
        </p>
      </Card>
    </div>
  )
}
