import { TodayItemDTO } from "@/types"
import { render, screen } from "@testing-library/react"

import { HabitItem } from "@/components/dashboard/habit-item"
import { getDictionary } from "@/lib/i18n"

describe("HabitItem", () => {
  const dict = getDictionary("zh")
  const mockHabit: TodayItemDTO = {
    id: "habit_1",
    title: "每日深度阅读",
    whyPrompt: "保持专注思考",
    type: "HABIT",
    layer: "SIGNAL",
    customCategory: "学习与输入",
    status: "ACTIVE",
    colorCode: "#8B5CF6",
    dueDate: null,
    recommendedAction: "阅读20分钟",
    actionPresets: [
      {
        id: "p1",
        itemId: "habit_1",
        energyLevel: "HIGH",
        actionText: "深度阅读45分钟",
        description: null,
      },
      {
        id: "p2",
        itemId: "habit_1",
        energyLevel: "NORMAL",
        actionText: "阅读20分钟",
        description: null,
      },
      {
        id: "p3",
        itemId: "habit_1",
        energyLevel: "LOW",
        actionText: "读1段文字",
        description: null,
      },
      {
        id: "p4",
        itemId: "habit_1",
        energyLevel: "REST",
        actionText: "有意识休整",
        description: null,
      },
    ],
    recommendedTool: null,
    toolLinks: [],
    todayCheckIn: null,
    actionStreak: 3,
    rhythmStreak: 5,
    maintainedDays: 0,
  }

  test("renders habit item with title and quiet state dot trigger", () => {
    render(
      <HabitItem
        item={mockHabit}
        onOpenRecord={jest.fn()}
        onRefresh={jest.fn()}
      />
    )

    expect(screen.getByText("每日深度阅读")).toBeInTheDocument()
    expect(screen.getByLabelText("点击记录今日行动")).toBeInTheDocument()
  })

  test("renders completed state with Low energy state dot tooltip", () => {
    const completedMock: TodayItemDTO = {
      ...mockHabit,
      todayCheckIn: {
        id: "c1",
        status: "COMPLETED",
        actualEnergy: "LOW",
        actionText: "读了1个关键段落",
        notes: null,
      },
    }

    render(
      <HabitItem
        item={completedMock}
        onOpenRecord={jest.fn()}
        onRefresh={jest.fn()}
      />
    )

    expect(screen.getByLabelText("轻行动完成 — 点击调整")).toBeInTheDocument()
  })

  test("renders Rest state with explicit rest dot tooltip", () => {
    const restMock: TodayItemDTO = {
      ...mockHabit,
      todayCheckIn: {
        id: "c2",
        status: "REST",
        actualEnergy: "REST",
        actionText: "今日有意识休整恢复",
        notes: null,
      },
    }

    render(
      <HabitItem
        item={restMock}
        onOpenRecord={jest.fn()}
        onRefresh={jest.fn()}
      />
    )

    expect(screen.getByLabelText("主动休整 — 点击调整")).toBeInTheDocument()
  })

  test("renders streak badge and 7-day mini dots correctly", () => {
    const habitWithTrace: TodayItemDTO = {
      ...mockHabit,
      actionStreak: 12,
      rhythmStreak: 12,
      recent7Days: [
        { date: "2026-08-22", status: "COMPLETED", actualEnergy: "HIGH" },
        { date: "2026-08-23", status: "COMPLETED", actualEnergy: "NORMAL" },
        { date: "2026-08-24", status: "REST", actualEnergy: "REST" },
        { date: "2026-08-25", status: "COMPLETED", actualEnergy: "LOW" },
        { date: "2026-08-26", status: null, actualEnergy: null },
        { date: "2026-08-27", status: "COMPLETED", actualEnergy: "NORMAL" },
        { date: "2026-08-28", status: null, actualEnergy: null },
      ],
    }

    render(
      <HabitItem
        item={habitWithTrace}
        onOpenRecord={jest.fn()}
        onRefresh={jest.fn()}
      />
    )

    expect(screen.getByText(/12\s*天/)).toBeInTheDocument()
    expect(screen.getByLabelText("This week trace")).toBeInTheDocument()
  })

  test("does not render external link icon when item has no tool links", () => {
    render(
      <HabitItem
        item={mockHabit}
        onOpenRecord={jest.fn()}
        onRefresh={jest.fn()}
      />
    )

    expect(screen.queryByTitle(/readselah\.org/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/打开关联工具/)).not.toBeInTheDocument()
  })

  test("renders external tool link icon with domain tooltip and target blank when toolLinks exist", () => {
    const onOpenRecord = jest.fn()
    const habitWithTool: TodayItemDTO = {
      ...mockHabit,
      toolLinks: [
        {
          id: "tl1",
          itemId: "habit_1",
          title: "Selah Bible",
          url: "https://www.readselah.org/workspace",
          energyLevel: null,
          description: null,
          sortOrder: 0,
        },
      ],
    }

    render(
      <HabitItem
        item={habitWithTool}
        onOpenRecord={onOpenRecord}
        onRefresh={jest.fn()}
      />
    )

    const linkEl = screen.getByTitle("Selah Bible (readselah.org)")
    expect(linkEl).toBeInTheDocument()
    expect(linkEl).toHaveAttribute(
      "href",
      "https://www.readselah.org/workspace"
    )
    expect(linkEl).toHaveAttribute("target", "_blank")
    expect(linkEl).toHaveAttribute("rel", "noopener noreferrer")
    expect(linkEl).toHaveAttribute(
      "aria-label",
      expect.stringContaining("readselah.org")
    )
  })
})
