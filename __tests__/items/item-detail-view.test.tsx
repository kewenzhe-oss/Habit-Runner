import type { ItemDetailDTO } from "@/types"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { ItemTrendData } from "@/lib/api/trends"
import { I18nProvider } from "@/lib/i18n"
import { ItemDetailView } from "@/components/items/item-detail-view"

const item: ItemDetailDTO = {
  id: "habit_1",
  userId: "user_1",
  categoryId: null,
  title: "Deep reading",
  whyPrompt: "Stay curious",
  type: "HABIT",
  layer: "SIGNAL",
  customCategory: null,
  status: "ACTIVE",
  unitType: "TIME",
  targetAmount: 20,
  unitLabel: "minutes",
  frequencyDays: "1,2,3,4,5,6,7",
  targetPerWeek: 7,
  dueDate: null,
  triggerCue: null,
  quitContext: null,
  highRiskWindow: null,
  todoRecurrence: null,
  sortOrder: 0,
  priority: "NORMAL",
  colorCode: "#10B981",
  createdAt: new Date("2026-10-01T12:00:00.000Z"),
  updatedAt: new Date("2026-10-20T12:00:00.000Z"),
  archivedAt: null,
  actionPresets: [
    {
      id: "preset_high",
      itemId: "habit_1",
      energyLevel: "HIGH",
      actionText: "Read a challenging chapter",
      description: null,
    },
    {
      id: "preset_normal",
      itemId: "habit_1",
      energyLevel: "NORMAL",
      actionText: "Read for 20 minutes",
      description: null,
    },
  ],
  toolLinks: [],
  checkIns: [],
}

const trendData: ItemTrendData = {
  itemId: item.id,
  title: item.title,
  whyPrompt: item.whyPrompt,
  type: "HABIT",
  rangeDays: 30,
  startDate: "2026-10-20",
  endDate: "2026-10-20",
  dailyPoints: [
    {
      date: "2026-10-20",
      dayOfWeek: 2,
      status: "COMPLETED",
      actualEnergy: "HIGH",
      actionText: "Read 45 minutes",
      isScheduled: true,
      isLogged: true,
      isRest: false,
      isCompleted: true,
      isKept: false,
      isLapsed: false,
    },
  ],
  weeklyPoints: [
    {
      weekLabel: "W1 (10-20)",
      startDate: "2026-10-20",
      endDate: "2026-10-20",
      occurrenceCount: 0,
      lapseCount: 0,
      keptCount: 0,
      completedCount: 1,
      recordedDays: 1,
      scheduledDays: 1,
      unloggedDays: 0,
      isFullyObserved: true,
      totalDaysInWeek: 1,
      completionRate: 100,
    },
  ],
  summary: {
    totalDays: 1,
    scheduledOpportunities: 1,
    recordedDays: 1,
    unloggedScheduledDays: 0,
    fullyObservedZeroWeeks: 0,
    totalCompleted: 1,
    totalRestDays: 0,
    totalOccurrences: 0,
    totalLapses: 0,
    totalKeptDays: 0,
    completionRate: 100,
    observationRate: 100,
  },
}

describe("ItemDetailView", () => {
  it("renders the complete detail and chart copy in English", async () => {
    const user = userEvent.setup()
    render(
      <I18nProvider initialLocale="en">
        <ItemDetailView
          item={item}
          streaks={{
            actionStreak: 5,
            rhythmStreak: 5,
            longestActionStreak: 8,
            maintainedDays: 0,
          }}
          initialTrendData={trendData}
        />
      </I18nProvider>
    )

    expect(
      screen.getByRole("heading", {
        name: "Three Energy Action Blueprints",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("Push forward")).toBeInTheDocument()
    expect(screen.getByText("Steady baseline")).toBeInTheDocument()
    expect(screen.getByText("Micro connection")).toBeInTheDocument()
    expect(screen.getByText("Lowest friction")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: "Habit Footprint & Flow Journal",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("No footprints yet")).toBeInTheDocument()
    expect(screen.queryByText(/三档行动能量蓝图/)).not.toBeInTheDocument()

    const dayButton = screen.getByRole("button", {
      name: "2026-10-20 · High-energy action · Read 45 minutes",
    })
    expect(dayButton).toHaveClass("h-5", "w-5")

    const rangeButton = screen.getByRole("button", { name: "Past 30 Days" })
    expect(rangeButton).toHaveClass("min-h-[36px]")

    await user.click(dayButton)
    const popover = screen.getByRole("dialog")
    expect(popover).toHaveClass("max-w-[calc(100vw-2rem)]")
    expect(popover).toHaveTextContent("High-energy action")
    expect(popover).toHaveTextContent("Read 45 minutes")

    await user.keyboard("{Escape}")

    const weeklyTrigger = screen.getByRole("button", {
      name: "Open weekly progress details for 1 week",
    })
    expect(weeklyTrigger).toHaveClass("min-h-[44px]")
    await user.click(weeklyTrigger)

    const weeklyDialog = screen.getByRole("dialog")
    expect(weeklyDialog).toHaveTextContent("Weekly progress details")
    expect(weeklyDialog).toHaveTextContent("2026-10-20 to 2026-10-20 (1 week)")
    expect(weeklyDialog).toHaveTextContent("Oct 20 – Oct 20")
    expect(weeklyDialog).toHaveTextContent("1/1 days")
    expect(weeklyDialog).toHaveTextContent("100%")
    expect(weeklyDialog).toHaveClass("max-w-xl")
  })
})
