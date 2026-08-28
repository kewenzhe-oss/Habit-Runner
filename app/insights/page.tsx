import { Metadata } from "next"
import { redirect } from "next/navigation"

import { getActivityHistoryData } from "@/lib/api/history"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"
import { ActivityOverviewStats } from "@/components/history/activity-overview-stats"
import { ActiveHabitsConsistencyList } from "@/components/history/active-habits-consistency-list"
import { CompletedTodosCard } from "@/components/history/completed-todos-card"
import { StarterWeeklyCard } from "@/components/history/starter-weekly-card"
import { Compact4WeekMatrix } from "@/components/history/compact-4week-matrix"
import { GlobalActivityHeatmap } from "@/components/history/global-activity-heatmap"
import { HistoryPageHeader } from "@/components/history/history-page-header"
import { Shell } from "@/components/layout/shell"

export const metadata: Metadata = {
  title: "Activity History",
  description: "View your habit consistency traces and action history.",
}

export default async function InsightsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/signin")
  }

  const todayStr = await getUserToday(user.id)
  const historyData = await getActivityHistoryData(user.id, todayStr)

  return (
    <Shell className="space-y-6">
      {/* 1. Header */}
      <HistoryPageHeader />

      {/* 2. Top Summary Badges */}
      <ActivityOverviewStats overview={historyData.overview} />

      {/* 3. Hero Visual by Data Maturity Stage */}
      {historyData.stage === "STARTER" && (
        <StarterWeeklyCard
          thisWeekDays={historyData.thisWeekDays}
          recentActions={historyData.recentActions}
        />
      )}

      {historyData.stage === "FORMING" && (
        <Compact4WeekMatrix days={historyData.heatmapDays} />
      )}

      {historyData.stage === "MATURE" && (
        <GlobalActivityHeatmap
          days={historyData.heatmapDays}
          defaultWindowWeeks={historyData.overview.defaultWindowWeeks}
          effectiveSpanDays={historyData.overview.effectiveSpanDays}
        />
      )}

      {/* 4. Active Routines & Consistency List (Habits only) */}
      <ActiveHabitsConsistencyList items={historyData.activeItems} />

      {/* 5. Recently Completed Tasks (Auxiliary TODO log) */}
      <CompletedTodosCard completedTodos={historyData.completedTodos} />
    </Shell>
  )
}
