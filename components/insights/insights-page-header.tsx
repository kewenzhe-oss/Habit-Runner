"use client"

import { formatLocalizedDateRange, useI18n } from "@/lib/i18n"
import { DashboardHeader } from "@/components/pages/dashboard/dashboard-header"

interface InsightsPageHeaderProps {
  from: string
  to: string
}

export function InsightsPageHeader({ from, to }: InsightsPageHeaderProps) {
  const { dict, locale } = useI18n()
  const formattedRange = formatLocalizedDateRange(from, to, locale)

  return (
    <DashboardHeader
      heading={dict.insights.header.title}
      text={`${dict.insights.header.periodLabel} · ${formattedRange}`}
    />
  )
}
