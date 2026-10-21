import { TodayItemDTO } from "@/types"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TodayCompassCard } from "@/components/dashboard/today-compass-card"

describe("TodayCompassCard", () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  const mockHabit1: TodayItemDTO = {
    priority: "NORMAL",
    sortOrder: 0,
    createdAt: "2026-08-01T00:00:00.000Z",
    id: "h_1",
    title: "每天晨跑 20 分钟",
    type: "HABIT",
    layer: "BODY",
    status: "ACTIVE",
    actionStreak: 5,
    rhythmStreak: 5,
    actionPresets: [],
    toolLinks: [],
    todayCheckIn: null,
  }

  const mockHabit2: TodayItemDTO = {
    priority: "NORMAL",
    sortOrder: 0,
    createdAt: "2026-08-01T00:00:00.000Z",
    id: "h_2",
    title: "深度阅读 15 分钟",
    type: "HABIT",
    layer: "SIGNAL",
    status: "ACTIVE",
    actionStreak: 3,
    rhythmStreak: 3,
    actionPresets: [],
    toolLinks: [],
    todayCheckIn: {
      id: "c_2",
      status: "COMPLETED",
      actualEnergy: "NORMAL",
    },
  }

  const mockTodo: TodayItemDTO = {
    priority: "NORMAL",
    sortOrder: 0,
    createdAt: "2026-08-01T00:00:00.000Z",
    id: "t_1",
    title: "修水管",
    type: "TODO",
    layer: "LIFE",
    status: "ACTIVE",
    actionStreak: 0,
    rhythmStreak: 0,
    actionPresets: [],
    toolLinks: [],
  }

  test("renders IN_PROGRESS state when habits remain uncompleted", () => {
    render(
      <TodayCompassCard
        items={[mockHabit1, mockHabit2, mockTodo]}
        dailyEnergy="NORMAL"
        dateStr="2026-08-28"
      />
    )

    expect(screen.getByText(/今日还剩 1 项日常/)).toBeInTheDocument()
    expect(screen.getByText(/今日进行中/)).toBeInTheDocument()
    expect(screen.getByText(/另有 1 个待办任务待处理/)).toBeInTheDocument()
    // Must NOT render individual habit title
    expect(screen.queryByText("每天晨跑 20 分钟")).not.toBeInTheDocument()
  })

  test("renders COMPLETED state when all daily habits are checked in", () => {
    const completedHabit1 = {
      ...mockHabit1,
      todayCheckIn: {
        id: "c_1",
        status: "COMPLETED" as const,
        actualEnergy: "HIGH" as const,
      },
    }

    render(
      <TodayCompassCard
        items={[completedHabit1, mockHabit2]}
        dailyEnergy="HIGH"
        dateStr="2026-08-28"
      />
    )

    expect(screen.getByText("今天的日常已全部完成")).toBeInTheDocument()
    expect(screen.getByText(/今日日常已达成/)).toBeInTheDocument()
  })

  test("renders REST state when daily energy is set to REST", () => {
    render(
      <TodayCompassCard
        items={[mockHabit1, mockHabit2]}
        dailyEnergy="REST"
        dateStr="2026-08-28"
      />
    )

    expect(screen.getByText("今天处于主动休整状态")).toBeInTheDocument()
    expect(screen.getByText(/今日主动休整/)).toBeInTheDocument()
  })

  test("always shows the daily wisdom quote and supports copy and shuffle", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    const user = userEvent.setup({ writeToClipboard: false })
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    const { container } = render(
      <TodayCompassCard
        items={[mockHabit1, mockHabit2]}
        dailyEnergy="NORMAL"
        dateStr="2026-08-28"
      />
    )

    const blockquote = container.querySelector("blockquote")
    expect(blockquote).toBeInTheDocument()
    expect(blockquote?.textContent).toBeTruthy()
    expect(screen.getByRole("heading", { name: "每日灵感" })).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "每日灵感" })
    ).not.toBeInTheDocument()

    const copyButton = screen.getByRole("button", { name: /复制金句/i })
    await user.click(copyButton)
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^".+" — .+$/))

    const shuffleButton = screen.getByRole("button", { name: /换一句/i })
    await user.click(shuffleButton)
    expect(shuffleButton.querySelector("svg")).toHaveClass("rotate-180")
    expect(container.querySelector("blockquote")).toBeVisible()
  })
})
