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

    expect(screen.getByText(/今日还有 1 项待记录/)).toBeInTheDocument()
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

    expect(screen.getByText("今天的日常已全部记录")).toBeInTheDocument()
    expect(screen.getByText(/今日日常已记录/)).toBeInTheDocument()
  })

  test("counts a lapsed quit habit as recorded without calling it completed", () => {
    const lapsedHabit: TodayItemDTO = {
      ...mockHabit1,
      type: "QUIT_HABIT",
      todayCheckIn: { id: "lapse", status: "LAPSED", actualEnergy: null },
    }
    const { rerender } = render(
      <TodayCompassCard items={[lapsedHabit, mockHabit1]} dailyEnergy="NORMAL" dateStr="2026-08-28" />
    )
    expect(screen.getByText(/已记录 1\/2/)).toBeInTheDocument()
    expect(screen.getByText("今日还有 1 项待记录")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1")

    rerender(<TodayCompassCard items={[lapsedHabit]} dailyEnergy="NORMAL" dateStr="2026-08-28" />)
    expect(screen.getByText("今天的日常已全部记录")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1")
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

  test("reveals the daily wisdom quote and supports copy and shuffle", async () => {
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
    expect(blockquote).toBeVisible()
    await user.click(screen.getByText("每日灵感"))
    expect(blockquote).not.toBeVisible()
    await user.click(screen.getByText("每日灵感"))

    const copyButton = screen.getByRole("button", { name: /复制金句/i })
    await user.click(copyButton)
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^".+" — .+$/))

    const shuffleButton = screen.getByRole("button", { name: /换一句/i })
    await user.click(shuffleButton)
    expect(shuffleButton.querySelector("svg")).toHaveClass("rotate-180")
    expect(container.querySelector("blockquote")).toBeVisible()
  })
})
