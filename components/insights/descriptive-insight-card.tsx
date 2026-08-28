"use client"

import * as React from "react"

import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useI18n } from "@/lib/i18n"

interface DescriptiveInsightCardProps {
  insight: string
  completionSummary: {
    habitActionsCompleted: number
    restDaysChosen: number
    quitsMaintainedDays: number
    todosFinished: number
  }
}

export function DescriptiveInsightCard({
  insight,
  completionSummary,
}: DescriptiveInsightCardProps) {
  const { dict: fullDict } = useI18n()
  const dict = fullDict.insights.rhythmCard

  return (
    <Card className="relative space-y-4 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-6">
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icons.sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {dict.title}
            </h3>
            <span className="py-0.2 rounded bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
              {dict.tag}
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-muted-foreground">
            “{insight}”
          </p>
        </div>
      </div>

      {/* 4 Stats Badges with WCAG AA Compliant High Contrast */}
      <div className="grid grid-cols-2 gap-2.5 border-t border-border/60 pt-2 sm:grid-cols-4">
        <div className="shadow-xs space-y-1 rounded-lg border bg-background/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              {dict.statHabit}
            </span>
            <span className="py-0.2 rounded bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {dict.statHabitTag}
            </span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {completionSummary.habitActionsCompleted}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {dict.timesUnit}
            </span>
          </div>
        </div>

        <div className="shadow-xs space-y-1 rounded-lg border bg-background/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              {dict.statRest}
            </span>
            <span className="py-0.2 rounded bg-purple-100 px-1.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
              {dict.statRestTag}
            </span>
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {completionSummary.restDaysChosen}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {dict.daysUnit}
            </span>
          </div>
        </div>

        <div className="shadow-xs space-y-1 rounded-lg border bg-background/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              {dict.statQuit}
            </span>
            <span className="py-0.2 rounded bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {dict.statQuitTag}
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {completionSummary.quitsMaintainedDays}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {dict.daysUnit}
            </span>
          </div>
        </div>

        <div className="shadow-xs space-y-1 rounded-lg border bg-background/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              {dict.statTodo}
            </span>
            <span className="py-0.2 rounded bg-blue-100 px-1.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              {dict.statTodoTag}
            </span>
          </div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {completionSummary.todosFinished}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {dict.itemsUnit}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
