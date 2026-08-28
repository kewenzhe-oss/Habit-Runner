"use client"

import { useI18n } from "@/lib/i18n"

export function HistoryPageHeader() {
  const { dict } = useI18n()
  const historyDict = dict.insights.activityHistory

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {historyDict.headerTitle}
      </h1>
      <p className="text-xs text-muted-foreground sm:text-sm">
        {historyDict.headerSubtitle}
      </p>
    </div>
  )
}
