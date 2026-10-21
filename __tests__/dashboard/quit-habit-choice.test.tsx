import * as React from "react"
import type { TodayItemDTO } from "@/types"
import { act, fireEvent, render, screen } from "@testing-library/react"

import { useDashboardItems } from "@/hooks/use-dashboard-items"
import { HabitItem } from "@/components/dashboard/habit-item"

const quitHabit: TodayItemDTO = {
  id: "quit_habit_1",
  title: "停止睡前刷手机",
  type: "QUIT_HABIT",
  layer: "SIGNAL",
  priority: "NORMAL",
  status: "ACTIVE",
  sortOrder: 0,
  createdAt: "2026-10-01T00:00:00.000Z",
  actionPresets: [],
  toolLinks: [],
  actionStreak: 4,
  rhythmStreak: 4,
  maintainedDays: 4,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

function QuitHabitHarness({
  initialItem,
  onOpenRecord = jest.fn(),
}: {
  initialItem: TodayItemDTO
  onOpenRecord?: jest.Mock
}) {
  const initialItems = React.useMemo(() => [initialItem], [initialItem])
  const { items, mutateItem, pendingIds } = useDashboardItems(initialItems)
  const item = items[0]

  return (
    <HabitItem
      item={item}
      onOpenRecord={onOpenRecord}
      onRefresh={jest.fn()}
      onMutate={mutateItem}
      isPending={pendingIds.has(item.id)}
      dateStr="2026-10-21"
    />
  )
}

afterEach(() => {
  jest.restoreAllMocks()
})

it("changes a recorded KEPT choice to LAPSED through quit-status", async () => {
  const request = deferred<{ ok: boolean; json: () => Promise<unknown> }>()
  global.fetch = jest.fn(() => request.promise) as jest.Mock
  const onOpenRecord = jest.fn()
  render(
    <QuitHabitHarness
      initialItem={{
        ...quitHabit,
        todayCheckIn: { id: "kept", status: "KEPT", actualEnergy: null },
      }}
      onOpenRecord={onOpenRecord}
    />
  )

  const kept = screen.getByRole("button", { name: "做到了" })
  const lapsed = screen.getByRole("button", { name: "没做到" })
  expect(screen.getByText("今天做到了吗？")).toBeInTheDocument()
  expect(kept).toHaveAttribute("aria-pressed", "true")
  expect(lapsed).toHaveAttribute("aria-pressed", "false")

  fireEvent.click(lapsed)

  expect(lapsed).toHaveAttribute("aria-pressed", "true")
  expect(kept).toHaveAttribute("aria-pressed", "false")
  expect(lapsed).toBeDisabled()
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/items/quit_habit_1/quit-status",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ status: "LAPSED", date: "2026-10-21" }),
    })
  )
  expect(onOpenRecord).not.toHaveBeenCalled()

  await act(async () => {
    request.resolve({
      ok: true,
      json: async () => ({
        id: "saved-lapsed",
        status: "LAPSED",
        actualEnergy: null,
        streaks: { actionStreak: 0, rhythmStreak: 0, maintainedDays: 0 },
      }),
    })
    await request.promise
  })
})

it("changes a recorded LAPSED choice to KEPT through quit-status", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: "saved-kept",
      status: "KEPT",
      actualEnergy: null,
      streaks: { actionStreak: 5, rhythmStreak: 5, maintainedDays: 5 },
    }),
  })
  render(
    <QuitHabitHarness
      initialItem={{
        ...quitHabit,
        todayCheckIn: { id: "lapsed", status: "LAPSED", actualEnergy: null },
      }}
    />
  )

  const kept = screen.getByRole("button", { name: "做到了" })
  const lapsed = screen.getByRole("button", { name: "没做到" })
  expect(kept).toHaveAttribute("aria-pressed", "false")
  expect(lapsed).toHaveAttribute("aria-pressed", "true")

  await act(async () => {
    fireEvent.click(kept)
  })

  expect(kept).toHaveAttribute("aria-pressed", "true")
  expect(lapsed).toHaveAttribute("aria-pressed", "false")
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/items/quit_habit_1/quit-status",
    expect.objectContaining({
      body: JSON.stringify({ status: "KEPT", date: "2026-10-21" }),
    })
  )
})

it("does not request the selected choice or repeat a pending choice", async () => {
  const request = deferred<{ ok: boolean; json: () => Promise<unknown> }>()
  global.fetch = jest.fn(() => request.promise) as jest.Mock
  render(
    <QuitHabitHarness
      initialItem={{
        ...quitHabit,
        todayCheckIn: { id: "kept", status: "KEPT", actualEnergy: null },
      }}
    />
  )

  fireEvent.click(screen.getByRole("button", { name: "做到了" }))
  expect(global.fetch).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole("button", { name: "没做到" }))
  fireEvent.click(screen.getByRole("button", { name: "没做到" }))
  fireEvent.click(screen.getByRole("button", { name: "做到了" }))
  expect(global.fetch).toHaveBeenCalledTimes(1)

  await act(async () => {
    request.resolve({
      ok: true,
      json: async () => ({
        id: "saved-lapsed",
        status: "LAPSED",
        actualEnergy: null,
        streaks: { actionStreak: 0, rhythmStreak: 0, maintainedDays: 0 },
      }),
    })
    await request.promise
  })
})

it("keeps the original recorded choice when saving fails", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false })
  render(
    <QuitHabitHarness
      initialItem={{
        ...quitHabit,
        todayCheckIn: { id: "kept", status: "KEPT", actualEnergy: null },
      }}
    />
  )

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "没做到" }))
  })

  expect(screen.getByRole("button", { name: "做到了" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  expect(screen.getByRole("button", { name: "没做到" })).toHaveAttribute(
    "aria-pressed",
    "false"
  )
  expect(screen.getByRole("button", { name: "做到了" })).toBeEnabled()
  expect(global.fetch).toHaveBeenCalledTimes(1)
})

it("restores the original choice when fetch rejects", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("Network unavailable"))
  render(
    <QuitHabitHarness
      initialItem={{
        ...quitHabit,
        todayCheckIn: { id: "kept", status: "KEPT", actualEnergy: null },
      }}
    />
  )

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "没做到" }))
  })

  expect(screen.getByRole("button", { name: "做到了" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  expect(screen.getByRole("button", { name: "做到了" })).toBeEnabled()
  expect(screen.getByRole("button", { name: "没做到" })).toHaveAttribute(
    "aria-pressed",
    "false"
  )
  expect(global.fetch).toHaveBeenCalledTimes(1)
})

it("restores the original choice when a successful response cannot be parsed", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockRejectedValue(new SyntaxError("Invalid JSON")),
  })
  render(
    <QuitHabitHarness
      initialItem={{
        ...quitHabit,
        todayCheckIn: { id: "kept", status: "KEPT", actualEnergy: null },
      }}
    />
  )

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "没做到" }))
  })

  expect(screen.getByRole("button", { name: "做到了" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  expect(screen.getByRole("button", { name: "做到了" })).toBeEnabled()
  expect(screen.getByRole("button", { name: "没做到" })).toHaveAttribute(
    "aria-pressed",
    "false"
  )
  expect(global.fetch).toHaveBeenCalledTimes(1)
})

it("allows a failed choice to be retried successfully", async () => {
  const fetchMock = jest
    .fn()
    .mockRejectedValueOnce(new Error("Network unavailable"))
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "saved-lapsed",
        status: "LAPSED",
        actualEnergy: null,
        streaks: { actionStreak: 0, rhythmStreak: 0, maintainedDays: 0 },
      }),
    })
  global.fetch = fetchMock
  render(
    <QuitHabitHarness
      initialItem={{
        ...quitHabit,
        todayCheckIn: { id: "kept", status: "KEPT", actualEnergy: null },
      }}
    />
  )

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "没做到" }))
  })

  expect(screen.getByRole("button", { name: "做到了" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  expect(screen.getByRole("button", { name: "做到了" })).toBeEnabled()

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "没做到" }))
  })

  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(screen.getByRole("button", { name: "没做到" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  expect(screen.getByRole("button", { name: "做到了" })).toHaveAttribute(
    "aria-pressed",
    "false"
  )
  expect(screen.getByRole("button", { name: "没做到" })).toBeEnabled()
})
