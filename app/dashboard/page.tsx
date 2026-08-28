import { Metadata } from "next"
import { redirect } from "next/navigation"

import { getTodayDashboardData } from "@/lib/api/checkin"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { HabitList } from "@/components/dashboard/habit-list"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track and manage your daily habits, reduction goals, and tasks.",
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user?.id) {
    redirect(authOptions?.pages?.signIn || "/signin")
  }

  const todayStr = await getUserToday(user.id)
  const dashboardData = await getTodayDashboardData(user.id, todayStr)

  return (
    <div className="space-y-6">
      {/* Locale-aware Header */}
      <DashboardPageHeader />

      {/* Main Action Stream — TodayCompassCard is rendered inside HabitList as the first element */}
      <HabitList
        initialItems={dashboardData.items}
        dailyEnergy={dashboardData.dailyEnergy}
        dailyEnergyNote={dashboardData.dailyEnergyNote}
        dateStr={dashboardData.date}
      />
    </div>
  )
}
