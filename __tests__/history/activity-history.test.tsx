import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  CompletedTodoSummary,
  GlobalHeatmapDay,
  HistoryItemSummary,
  RecentActionRecord,
} from "@/lib/api/history"
import { getDictionary } from "@/lib/i18n"
import { ActiveHabitsConsistencyList } from "@/components/history/active-habits-consistency-list"
import { ActivityOverviewStats } from "@/components/history/activity-overview-stats"
import { Compact4WeekMatrix } from "@/components/history/compact-4week-matrix"
import { CompletedTodosCard } from "@/components/history/completed-todos-card"
import { GlobalActivityHeatmap } from "@/components/history/global-activity-heatmap"
import { StarterWeeklyCard } from "@/components/history/starter-weekly-card"

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
    expect(
      screen.getByText(historyDict.stats.totalCheckIns)
    ).toBeInTheDocument()
    expect(screen.getByText("45")).toBeInTheDocument()
    expect(screen.getByText(historyDict.stats.activeDays)).toBeInTheDocument()
    expect(screen.getByText("18")).toBeInTheDocument()
    expect(screen.getByText(historyDict.stats.bestStreak)).toBeInTheDocument()
  })

  test("renders StarterWeeklyCard with 7-day capsule bar and recent action records", () => {
    const mockThisWeekDays: GlobalHeatmapDay[] = [
      {
        dateStr: "2026-08-24",
        dayOfWeek: 1,
        isToday: false,
        isFuture: false,
        totalCount: 1,
        hasRest: false,
        primaryEnergy: "HIGH",
        statusSummary: "COMPLETED",
        actions: [{ title: "晨跑", type: "HABIT", status: "COMPLETED" }],
      },
      {
        dateStr: "2026-08-25",
        dayOfWeek: 2,
        isToday: false,
        isFuture: false,
        totalCount: 1,
        hasRest: false,
        primaryEnergy: "NORMAL",
        statusSummary: "COMPLETED",
        actions: [{ title: "读书", type: "HABIT", status: "COMPLETED" }],
      },
      {
        dateStr: "2026-08-26",
        dayOfWeek: 3,
        isToday: false,
        isFuture: false,
        totalCount: 0,
        hasRest: true,
        primaryEnergy: "REST",
        statusSummary: "REST",
        actions: [],
      },
      {
        dateStr: "2026-08-27",
        dayOfWeek: 4,
        isToday: true,
        isFuture: false,
        totalCount: 0,
        hasRest: false,
        primaryEnergy: null,
        statusSummary: null,
        actions: [],
      },
      {
        dateStr: "2026-08-28",
        dayOfWeek: 5,
        isToday: false,
        isFuture: true,
        totalCount: 0,
        hasRest: false,
        primaryEnergy: null,
        statusSummary: null,
        actions: [],
      },
      {
        dateStr: "2026-08-29",
        dayOfWeek: 6,
        isToday: false,
        isFuture: true,
        totalCount: 0,
        hasRest: false,
        primaryEnergy: null,
        statusSummary: null,
        actions: [],
      },
      {
        dateStr: "2026-08-30",
        dayOfWeek: 7,
        isToday: false,
        isFuture: true,
        totalCount: 0,
        hasRest: false,
        primaryEnergy: null,
        statusSummary: null,
        actions: [],
      },
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

  test("renders Compact4WeekMatrix with accessible dates and keyboard details", async () => {
    const mockDays: GlobalHeatmapDay[] = Array.from({ length: 28 }, (_, i) => {
      const d = new Date("2026-08-01")
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      return {
        dateStr,
        dayOfWeek: ((d.getDay() + 6) % 7) + 1,
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

    expect(
      screen.getByRole("heading", { name: "近 4 周日常节律" })
    ).toBeInTheDocument()
    expect(screen.getByText("本周")).toBeInTheDocument()
    expect(
      screen.getAllByRole("columnheader").map((cell) => cell.textContent)
    ).toEqual(["3周前", "2周前", "上周", "本周"])
    const user = userEvent.setup()
    await user.tab()
    const firstDay = screen.getByRole("button", {
      name: "2026-08-01 · 1 次完成",
    })
    expect(firstDay).toHaveFocus()
    expect(firstDay.querySelector('[data-signal="normal"]')).toBeInTheDocument()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("dialog")).toHaveTextContent("2026-08-01")
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(firstDay).toHaveFocus()
  })

  test("renders GlobalActivityHeatmap with touch buttons, status labels, and keyboard navigation", async () => {
    const mockDays: GlobalHeatmapDay[] = Array.from({ length: 112 }, (_, i) => {
      const d = new Date("2026-05-01")
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      return {
        dateStr,
        dayOfWeek: ((d.getDay() + 6) % 7) + 1,
        isToday: i === 111,
        isFuture: false,
        totalCount: i % 2 === 0 ? 2 : 0,
        hasRest: i % 5 === 0,
        primaryEnergy: i % 2 === 0 ? (i % 4 === 0 ? "HIGH" : "NORMAL") : null,
        statusSummary: i % 2 === 0 ? "COMPLETED" : null,
        actions:
          i % 2 === 0
            ? [
                {
                  title: "晨跑",
                  type: "HABIT" as const,
                  status: "COMPLETED" as const,
                },
              ]
            : [],
      }
    })

    render(<GlobalActivityHeatmap days={mockDays} />)

    expect(screen.getByText(historyDict.heatmap.title)).toBeInTheDocument()
    expect(screen.getByText(historyDict.heatmap.legendHigh)).toBeInTheDocument()
    expect(
      screen.getByText(historyDict.heatmap.legendNormal)
    ).toBeInTheDocument()
    expect(screen.getByText(historyDict.heatmap.legendRest)).toBeInTheDocument()

    const dateButtons = screen
      .getAllByRole("button")
      .filter((button) =>
        /^\d{4}-\d{2}-\d{2}/.test(button.getAttribute("aria-label") || "")
      )
    expect(dateButtons).toHaveLength(28)

    const firstDay = dateButtons[0]
    expect(firstDay).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/^2026-07-24 · 充沛 · 2 次行动 · 晨跑$/)
    )
    expect(firstDay.querySelector('[data-signal="high"]')).toBeInTheDocument()

    firstDay.focus()
    const user = userEvent.setup()
    await user.keyboard("{ArrowDown}")
    expect(dateButtons[1]).toHaveFocus()

    await user.click(firstDay)
    expect(screen.getByRole("dialog")).toHaveTextContent("晨跑")
    await user.click(document.body)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  test("keeps the weekday axis sticky and scrolls the heatmap to recent weeks", async () => {
    const mockDays: GlobalHeatmapDay[] = Array.from({ length: 112 }, (_, i) => {
      const d = new Date("2026-05-01")
      d.setDate(d.getDate() + i)
      return {
        dateStr: d.toISOString().split("T")[0],
        dayOfWeek: ((d.getDay() + 6) % 7) + 1,
        isToday: i === 111,
        isFuture: false,
        totalCount: 1,
        hasRest: false,
        primaryEnergy: "NORMAL",
        statusSummary: "COMPLETED",
        actions: [],
      }
    })

    const originalScrollWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollWidth"
    )
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return this.dataset.testid === "activity-heatmap-scroll" ? 624 : 0
      },
    })

    try {
      const { unmount } = render(
        <GlobalActivityHeatmap days={mockDays} defaultWindowWeeks={16} />
      )

      const normalSignals = document.querySelectorAll('[data-signal="normal"]')
      expect(normalSignals).toHaveLength(112)
      normalSignals.forEach((signal) => expect(signal).toBeEmptyDOMElement())

      const scrollContainer = screen.getByTestId("activity-heatmap-scroll")
      expect(scrollContainer.scrollLeft).toBe(624)

      expect(screen.getByText("一").parentElement).toHaveClass(
        "sticky",
        "left-0",
        "z-10",
        "bg-card"
      )

      scrollContainer.scrollLeft = 0
      fireEvent.click(screen.getByRole("button", { name: "近 8 周" }))
      await waitFor(() => expect(scrollContainer.scrollLeft).toBe(624))
      unmount()
    } finally {
      if (originalScrollWidth) {
        Object.defineProperty(
          HTMLElement.prototype,
          "scrollWidth",
          originalScrollWidth
        )
      } else {
        delete (HTMLElement.prototype as { scrollWidth?: number }).scrollWidth
      }
    }
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
          {
            date: "2026-08-22",
            dayOfWeek: 1,
            isToday: false,
            isFuture: false,
            status: "COMPLETED",
            actualEnergy: "HIGH",
          },
          {
            date: "2026-08-23",
            dayOfWeek: 2,
            isToday: false,
            isFuture: false,
            status: "COMPLETED",
            actualEnergy: "NORMAL",
          },
          {
            date: "2026-08-24",
            dayOfWeek: 3,
            isToday: false,
            isFuture: false,
            status: "REST",
            actualEnergy: "REST",
          },
          {
            date: "2026-08-25",
            dayOfWeek: 4,
            isToday: false,
            isFuture: false,
            status: "COMPLETED",
            actualEnergy: "LOW",
          },
          {
            date: "2026-08-26",
            dayOfWeek: 5,
            isToday: false,
            isFuture: false,
            status: null,
            actualEnergy: null,
          },
          {
            date: "2026-08-27",
            dayOfWeek: 6,
            isToday: true,
            isFuture: false,
            status: "COMPLETED",
            actualEnergy: "NORMAL",
          },
          {
            date: "2026-08-28",
            dayOfWeek: 7,
            isToday: false,
            isFuture: true,
            status: null,
            actualEnergy: null,
          },
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

    expect(
      screen.getByText(historyDict.completedTodos.title)
    ).toBeInTheDocument()
    expect(screen.getByText("给汽车做常规保养")).toBeInTheDocument()
    expect(screen.getByText("车辆与出行")).toBeInTheDocument()
  })
})
