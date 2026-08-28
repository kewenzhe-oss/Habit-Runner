import { render, screen } from "@testing-library/react"
import { ActivityOverviewStats } from "@/components/history/activity-overview-stats"
import { StarterWeeklyCard } from "@/components/history/starter-weekly-card"
import { Compact4WeekMatrix } from "@/components/history/compact-4week-matrix"
import { GlobalActivityHeatmap } from "@/components/history/global-activity-heatmap"
import { ActiveHabitsConsistencyList } from "@/components/history/active-habits-consistency-list"
import { CompletedTodosCard } from "@/components/history/completed-todos-card"
import { CompletedTodoSummary, GlobalHeatmapDay, HistoryItemSummary, RecentActionRecord } from "@/lib/api/history"
import { getDictionary } from "@/lib/i18n"

describe("Activity History Components", () => {
  const dict = getDictionary("zh")
  const historyDict = dict.insights.activityHistory

  test("renders ActivityOverviewStats with total check-ins, active days, and streak", () => {
    const mockOverview = {
      totalCheckIns: 128,
      activeDaysCount: 45,
      maxCurrentStreak: 18,
      activeHabitsCount: 3,
    }

    render(<ActivityOverviewStats overview={mockOverview} />)

    expect(screen.getByText("128")).toBeInTheDocument()
    expect(screen.getByText(historyDict.stats.totalCheckIns)).toBeInTheDocument()
    expect(screen.getByText("45")).toBeInTheDocument()
    expect(screen.getByText(historyDict.stats.activeDays)).toBeInTheDocument()
    expect(screen.getByText("18")).toBeInTheDocument()
    expect(screen.getByText(historyDict.stats.bestStreak)).toBeInTheDocument()
  })

  test("renders StarterWeeklyCard with 7-day capsule bar and recent action records", () => {
    const mockThisWeekDays: GlobalHeatmapDay[] = [
      { dateStr: "2026-08-24", dayOfWeek: 1, isToday: false, isFuture: false, totalCount: 1, hasRest: false, primaryEnergy: "HIGH", statusSummary: "COMPLETED", actions: [{ title: "晨跑", type: "HABIT", status: "COMPLETED" }] },
      { dateStr: "2026-08-25", dayOfWeek: 2, isToday: false, isFuture: false, totalCount: 1, hasRest: false, primaryEnergy: "NORMAL", statusSummary: "COMPLETED", actions: [{ title: "读书", type: "HABIT", status: "COMPLETED" }] },
      { dateStr: "2026-08-26", dayOfWeek: 3, isToday: false, isFuture: false, totalCount: 0, hasRest: true, primaryEnergy: "REST", statusSummary: "REST", actions: [] },
      { dateStr: "2026-08-27", dayOfWeek: 4, isToday: true, isFuture: false, totalCount: 0, hasRest: false, primaryEnergy: null, statusSummary: null, actions: [] },
      { dateStr: "2026-08-28", dayOfWeek: 5, isToday: false, isFuture: true, totalCount: 0, hasRest: false, primaryEnergy: null, statusSummary: null, actions: [] },
      { dateStr: "2026-08-29", dayOfWeek: 6, isToday: false, isFuture: true, totalCount: 0, hasRest: false, primaryEnergy: null, statusSummary: null, actions: [] },
      { dateStr: "2026-08-30", dayOfWeek: 7, isToday: false, isFuture: true, totalCount: 0, hasRest: false, primaryEnergy: null, statusSummary: null, actions: [] },
    ]

    const mockRecentActions: RecentActionRecord[] = [
      {
        id: "act_1",
        itemId: "item_1",
        title: "每天晨跑 20 分钟",
        date: "2026-08-24",
        dayOfWeekZh: "周一",
        dayOfWeekEn: "Mon",
        status: "COMPLETED",
        actualEnergy: "HIGH",
      },
    ]

    render(
      <StarterWeeklyCard
        thisWeekDays={mockThisWeekDays}
        recentActions={mockRecentActions}
      />
    )

    expect(screen.getByText("本周生活节律")).toBeInTheDocument()
    expect(screen.getByText("每天晨跑 20 分钟")).toBeInTheDocument()
    expect(screen.getByText("最近打卡记录")).toBeInTheDocument()
    expect(screen.getByText("周一")).toBeInTheDocument()
  })

  test("renders Compact4WeekMatrix with 4-week calendar grid", () => {
    const mockDays: GlobalHeatmapDay[] = Array.from({ length: 28 }, (_, i) => {
      const d = new Date("2026-08-01")
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      return {
        dateStr,
        dayOfWeek: (d.getDay() + 6) % 7 + 1,
        isToday: i === 27,
        isFuture: false,
        totalCount: i % 2 === 0 ? 1 : 0,
        hasRest: i % 5 === 0,
        primaryEnergy: i % 2 === 0 ? "NORMAL" : null,
        statusSummary: i % 2 === 0 ? "COMPLETED" : null,
        actions: [],
      }
    })

    render(<Compact4WeekMatrix days={mockDays} />)

    expect(screen.getByText("近 4 周日常节律")).toBeInTheDocument()
    expect(screen.getByText("本周")).toBeInTheDocument()
  })

  test("renders GlobalActivityHeatmap with 112 days and legend", () => {
    const mockDays: GlobalHeatmapDay[] = Array.from({ length: 112 }, (_, i) => {
      const d = new Date("2026-05-01")
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      return {
        dateStr,
        dayOfWeek: (d.getDay() + 6) % 7 + 1,
        isToday: i === 111,
        isFuture: false,
        totalCount: i % 2 === 0 ? 2 : 0,
        hasRest: i % 5 === 0,
        primaryEnergy: i % 2 === 0 ? "NORMAL" : null,
        statusSummary: i % 2 === 0 ? "COMPLETED" : null,
        actions:
          i % 2 === 0
            ? [{ title: "晨跑", type: "HABIT" as const, status: "COMPLETED" as const }]
            : [],
      }
    })

    render(<GlobalActivityHeatmap days={mockDays} />)

    expect(screen.getByText(historyDict.heatmap.title)).toBeInTheDocument()
    expect(screen.getByText(historyDict.heatmap.legendHigh)).toBeInTheDocument()
    expect(screen.getByText(historyDict.heatmap.legendNormal)).toBeInTheDocument()
    expect(screen.getByText(historyDict.heatmap.legendRest)).toBeInTheDocument()
  })

  test("renders ActiveHabitsConsistencyList with active routines and streaks", () => {
    const mockItems: HistoryItemSummary[] = [
      {
        id: "item_1",
        title: "每天晨跑 20 分钟",
        type: "HABIT",
        layer: "BODY",
        customCategory: "身体健康",
        colorCode: "#10B981",
        actionStreak: 12,
        rhythmStreak: 12,
        longestActionStreak: 24,
        maintainedDays: 0,
        totalCompletedCount: 48,
        recent7Days: [
          { date: "2026-08-22", dayOfWeek: 1, isToday: false, isFuture: false, status: "COMPLETED", actualEnergy: "HIGH" },
          { date: "2026-08-23", dayOfWeek: 2, isToday: false, isFuture: false, status: "COMPLETED", actualEnergy: "NORMAL" },
          { date: "2026-08-24", dayOfWeek: 3, isToday: false, isFuture: false, status: "REST", actualEnergy: "REST" },
          { date: "2026-08-25", dayOfWeek: 4, isToday: false, isFuture: false, status: "COMPLETED", actualEnergy: "LOW" },
          { date: "2026-08-26", dayOfWeek: 5, isToday: false, isFuture: false, status: null, actualEnergy: null },
          { date: "2026-08-27", dayOfWeek: 6, isToday: true, isFuture: false, status: "COMPLETED", actualEnergy: "NORMAL" },
          { date: "2026-08-28", dayOfWeek: 7, isToday: false, isFuture: true, status: null, actualEnergy: null },
        ],
      },
    ]

    render(<ActiveHabitsConsistencyList items={mockItems} />)

    expect(screen.getByText(historyDict.activeItems.title)).toBeInTheDocument()
    expect(screen.getByText("每天晨跑 20 分钟")).toBeInTheDocument()
    expect(screen.getByText(/12\s*天/)).toBeInTheDocument()
    expect(screen.getByText(/48\s*次/)).toBeInTheDocument()
  })

  test("renders CompletedTodosCard with completed tasks", () => {
    const mockCompletedTodos: CompletedTodoSummary[] = [
      {
        id: "todo_1",
        title: "给汽车做常规保养",
        customCategory: "车辆与出行",
        colorCode: "#3B82F6",
        completedDate: "2026-08-27",
        dueDate: "2026-08-28",
      },
    ]

    render(<CompletedTodosCard completedTodos={mockCompletedTodos} />)

    expect(screen.getByText(historyDict.completedTodos.title)).toBeInTheDocument()
    expect(screen.getByText("给汽车做常规保养")).toBeInTheDocument()
    expect(screen.getByText("车辆与出行")).toBeInTheDocument()
  })
})
