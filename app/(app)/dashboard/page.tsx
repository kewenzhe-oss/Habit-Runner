import { Metadata } from "next"
import { redirect } from "next/navigation"

import { getUserCategories } from "@/lib/api/categories"
import { getTodayDashboardData } from "@/lib/api/checkin"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { HabitList } from "@/components/dashboard/habit-list"

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Track and manage your daily habits, reduction goals, and tasks.",
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user?.id) {
    redirect(authOptions?.pages?.signIn || "/signin")
  }

  const todayStr = await getUserToday(user.id, new Date(), user.timezone)
  const [dashboardData, categories] = await Promise.all([
    getTodayDashboardData(user.id, todayStr),
    getUserCategories(user.id),
  ])

  return (
    <div className="space-y-6">
      {/* Locale-aware Header */}
      <DashboardPageHeader />

      {/* Main Action Stream — TodayCompassCard is rendered inside HabitList as the first element */}
      <HabitList
        key={dashboardData.date}
        initialItems={dashboardData.items}
        initialCategories={categories}
        dailyEnergy={dashboardData.dailyEnergy}
        dailyEnergyNote={dashboardData.dailyEnergyNote}
        dateStr={dashboardData.date}
        userEmail={user.email}
      />
    </div>
  )
}
