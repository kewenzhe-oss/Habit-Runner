import type { TodayItemDTO } from "@/types"
import { act, fireEvent, render, screen } from "@testing-library/react"

import { HabitList } from "@/components/dashboard/habit-list"
import { TodayCompassCard } from "@/components/dashboard/today-compass-card"

const todo: TodayItemDTO = {
  id: "todo",
  title: "Test task",
  type: "TODO",
  layer: "LIFE",
  priority: "NORMAL",
  status: "ACTIVE",
  sortOrder: 0,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-20T10:00:00.000Z",
  actionPresets: [],
  toolLinks: [],
  actionStreak: 0,
  rhythmStreak: 0,
}

afterEach(() => {
  jest.restoreAllMocks()
})

it("completes a task immediately without fetching the dashboard or categories again", async () => {
  let resolve!: (response: unknown) => void
  global.fetch = jest.fn(
    () =>
      new Promise((yes) => {
        resolve = yes
      })
  ) as jest.Mock
  render(
    <HabitList
      initialItems={[todo]}
      dailyEnergy="NORMAL"
      dateStr="2026-10-20"
    />
  )
  fireEvent.click(screen.getByRole("button", { name: "完成“Test task”" }))
  expect(
    screen.queryByRole("button", { name: "完成“Test task”" })
  ).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: /最近已办结/ })).toHaveTextContent(
    "1"
  )
  await act(async () => {
    resolve({
      ok: true,
      json: async () => ({
        status: "COMPLETED",
        todayCheckIn: { id: "saved", status: "COMPLETED" },
      }),
    })
  })
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/items/todo/todo-status",
    expect.objectContaining({
      body: JSON.stringify({ status: "COMPLETED", date: "2026-10-20" }),
    })
  )
})

it("restores a task when saving fails", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false })
  render(
    <HabitList
      initialItems={[todo]}
      dailyEnergy="NORMAL"
      dateStr="2026-10-20"
    />
  )
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "完成“Test task”" }))
  })
  expect(screen.getByRole("button", { name: "完成“Test task”" })).toBeEnabled()
})

it("changes energy and filtering together before the request finishes, and rolls both back", async () => {
  let resolve!: (response: unknown) => void
  global.fetch = jest.fn(
    () =>
      new Promise((yes) => {
        resolve = yes
      })
  ) as jest.Mock
  render(
    <HabitList
      initialItems={[todo]}
      dailyEnergy="NORMAL"
      dateStr="2026-10-20"
    />
  )
  fireEvent.click(screen.getByRole("button", { name: "微行动" }))
  expect(screen.getByRole("button", { name: "微行动" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  expect(screen.queryByText(todo.title)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "显示全部" }))
  expect(screen.getByText(todo.title)).toBeInTheDocument()
  await act(async () => {
    resolve({ ok: false })
  })
  expect(screen.getByRole("button", { name: "日常" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  expect(screen.getByText(todo.title)).toBeInTheDocument()
  expect(global.fetch).toHaveBeenCalledTimes(1)
})

it("syncs refreshed items and calculates the week from the calendar date", () => {
  const { rerender } = render(
    <HabitList initialItems={[]} dailyEnergy="NORMAL" dateStr="2026-10-20" />
  )
  rerender(
    <HabitList
      initialItems={[todo]}
      dailyEnergy="NORMAL"
      dateStr="2026-10-20"
    />
  )
  expect(screen.getByText(todo.title)).toBeInTheDocument()
  expect(screen.getByText("本周还剩 5 天")).toBeInTheDocument()
})

it("saves energy without a second network request", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  const onChange = jest.fn()
  render(
    <TodayCompassCard
      items={[]}
      dailyEnergy="NORMAL"
      dateStr="2026-10-20"
      onEnergyChange={onChange}
    />
  )
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "微行动" }))
  })
  expect(onChange).toHaveBeenCalledWith("LOW")
  expect(global.fetch).toHaveBeenCalledTimes(1)
})

it("keeps a recurring todo completed for today when its server status remains active", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      status: "ACTIVE",
      todayCheckIn: { id: "saved", status: "COMPLETED" },
    }),
  })
  render(
    <HabitList
      initialItems={[{ ...todo, todoRecurrence: "WEEKLY" }]}
      dailyEnergy="NORMAL"
      dateStr="2026-10-20"
    />
  )
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "完成“Test task”" }))
  })
  expect(
    screen.queryByRole("button", { name: "完成“Test task”" })
  ).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: /最近已办结/ })).toHaveTextContent(
    "1"
  )
})
