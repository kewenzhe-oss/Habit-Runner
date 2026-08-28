"use client"

import { useI18n } from "@/lib/i18n"
import { DashboardHeader } from "@/components/pages/dashboard/dashboard-header"

export function SettingsPageHeader() {
  const { dict } = useI18n()

  return (
    <DashboardHeader
      heading={dict.item.settingsPage.title}
      text={dict.item.settingsPage.description}
    />
  )
}
