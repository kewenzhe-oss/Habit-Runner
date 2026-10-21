import type { TodayItemDTO } from "@/types"
import { act, renderHook } from "@testing-library/react"

import { useDashboardItems } from "@/hooks/use-dashboard-items"

const todo: TodayItemDTO = {
  id: "one",
  title: "Read",
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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

it("updates immediately, locks the item during a slow write, and accepts the server result", async () => {
  const save = deferred<Partial<TodayItemDTO>>()
  const request = jest.fn(() => save.promise)
  const rows = [todo]
  const { result } = renderHook(() => useDashboardItems(rows))
  let mutation!: Promise<void>
  act(() => {
    mutation = result.current.mutateItem(todo, { status: "COMPLETED" }, request)
  })
  expect(result.current.items[0].status).toBe("COMPLETED")
  expect(result.current.pendingIds.has(todo.id)).toBe(true)
  await act(async () => {
    await result.current.mutateItem(todo, { status: "COMPLETED" }, request)
  })
  expect(request).toHaveBeenCalledTimes(1)
  await act(async () => {
    save.resolve({ status: "COMPLETED", updatedAt: "2026-10-20T11:00:00.000Z" })
    await mutation
  })
  expect(result.current.pendingIds.size).toBe(0)
  expect(result.current.items[0].updatedAt).toBe("2026-10-20T11:00:00.000Z")
})

it("rolls back only the failed item while another write succeeds", async () => {
  const second = { ...todo, id: "two" }
  const initial = [todo, second]
  const save = deferred<Partial<TodayItemDTO>>()
  const { result } = renderHook(() => useDashboardItems(initial))
  let mutation!: Promise<void>
  let failure!: Promise<void>
  act(() => {
    mutation = result.current.mutateItem(
      todo,
      { status: "COMPLETED" },
      () => save.promise
    )
    failure = mutation.catch(() => undefined)
  })
  await act(async () => {
    await result.current.mutateItem(
      second,
      { status: "COMPLETED" },
      async () => ({ status: "COMPLETED" })
    )
    save.reject(new Error("Offline"))
    await failure
  })
  expect(result.current.items.map((row) => row.status)).toEqual([
    "ACTIVE",
    "COMPLETED",
  ])
  expect(result.current.pendingIds.size).toBe(0)
})

it("accepts a newly created item without losing pending changes or a newer saved check-in", async () => {
  const initial = [todo]
  const created = { ...todo, id: "new", title: "New item" }
  const save = deferred<Partial<TodayItemDTO>>()
  const { result, rerender } = renderHook(
    ({ rows }) => useDashboardItems(rows),
    { initialProps: { rows: initial } }
  )
  let mutation!: Promise<void>
  act(() => {
    mutation = result.current.mutateItem(
      todo,
      { todayCheckIn: { id: "pending", status: "COMPLETED" } },
      () => save.promise
    )
  })
  rerender({ rows: [todo, created] })
  expect(result.current.items[0].todayCheckIn?.id).toBe("pending")
  await act(async () => {
    save.resolve({
      todayCheckIn: {
        id: "saved",
        status: "COMPLETED",
        updatedAt: "2026-10-20T11:00:00.000Z",
      },
    })
    await mutation
  })
  rerender({ rows: [{ ...todo }, created] })
  expect(result.current.items[0].todayCheckIn?.id).toBe("saved")
  expect(result.current.items[1].title).toBe("New item")
})
