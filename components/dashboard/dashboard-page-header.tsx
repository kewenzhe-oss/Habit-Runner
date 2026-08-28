"use client"

import { useI18n } from "@/lib/i18n"

export function DashboardPageHeader() {
  const { dict } = useI18n()

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {dict.dashboard.header.title}
      </h1>
      <p className="text-xs text-muted-foreground sm:text-sm">
        {dict.dashboard.header.subtitle}
      </p>
    </div>
  )
}
