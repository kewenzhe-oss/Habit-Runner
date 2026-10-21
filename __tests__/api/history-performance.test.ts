/** @jest-environment node */

import { calculateItemStreaks } from "@/lib/api/checkin"
import { getActivityHistoryData } from "@/lib/api/history"
import { getUserItems } from "@/lib/api/items"
import { db } from "@/lib/db"

jest.mock("@/lib/db", () => ({
  db: {
    checkIn: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
    },
    item: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock("@/lib/api/items", () => ({
  getUserItems: jest.fn(),
}))

jest.mock("@/lib/api/checkin", () => ({
  calculateItemStreaks: jest.fn(),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

const todayStr = "2026-10-21"
const habitItem = {
  id: "habit-1",
  userId: "user-1",
  title: "Read",
  type: "HABIT",
  layer: "LIFE",
  status: "ACTIVE",
  category: null,
  customCategory: null,
  colorCode: "#123456",
  createdAt: new Date("2026-09-01T00:00:00Z"),
  frequencyDays: null,
  targetPerWeek: null,
  actionPresets: [],
  toolLinks: [],
}

describe("getActivityHistoryData query scheduling", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(calculateItemStreaks as jest.Mock).mockResolvedValue({
      actionStreak: 3,
      rhythmStreak: 4,
      longestActionStreak: 5,
      maintainedDays: 0,
    })
  })

  it("starts independent reads immediately and the item-dependent streak read before slower stats finish", async () => {
    const items = deferred<Array<typeof habitItem>>()
    const windowCheckIns = deferred<unknown[]>()
    const latestActions = deferred<unknown[]>()
    const allTimeStats = deferred<unknown[]>()
    const completedTodos = deferred<unknown[]>()
    const earliestCheckIn = deferred<{ date: string } | null>()
    const batchCheckIns120 =
      deferred<Array<{ itemId: string; date: string; status: string }>>()

    ;(getUserItems as jest.Mock).mockReturnValue(items.promise)
    ;(db.checkIn.groupBy as jest.Mock).mockReturnValue(allTimeStats.promise)
    ;(db.item.findMany as jest.Mock).mockReturnValue(completedTodos.promise)
    ;(db.checkIn.findFirst as jest.Mock).mockReturnValue(
      earliestCheckIn.promise
    )
    ;(db.checkIn.findMany as jest.Mock).mockImplementation((args: any) => {
      if (args.where.itemId) return batchCheckIns120.promise
      if (args.include?.item?.select?.layer) return windowCheckIns.promise
      return latestActions.promise
    })

    const historyPromise = getActivityHistoryData("user-1", todayStr)

    expect(getUserItems).toHaveBeenCalledTimes(1)
    expect(db.checkIn.findMany).toHaveBeenCalledTimes(2)
    expect(db.checkIn.groupBy).toHaveBeenCalledTimes(1)
    expect(db.item.findMany).toHaveBeenCalledTimes(1)
    expect(db.checkIn.findFirst).toHaveBeenCalledTimes(1)
    expect(
      (db.checkIn.findMany as jest.Mock).mock.calls.some(
        ([args]) => args.where.itemId
      )
    ).toBe(false)

    items.resolve([habitItem])
    await flushPromises()

    expect(
      (db.checkIn.findMany as jest.Mock).mock.calls.some(
        ([args]) => args.where.itemId
      )
    ).toBe(true)
    expect(db.checkIn.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        itemId: { in: ["habit-1"] },
        date: { gte: "2026-06-23", lte: todayStr },
      },
      select: { itemId: true, date: true, status: true },
      orderBy: { date: "desc" },
    })

    batchCheckIns120.resolve([
      { itemId: "habit-1", date: "2026-10-21", status: "COMPLETED" },
      { itemId: "habit-1", date: "2026-10-20", status: "COMPLETED" },
    ])
    windowCheckIns.resolve([
      {
        id: "check-in-today",
        itemId: "habit-1",
        date: "2026-10-21",
        status: "COMPLETED",
        actualEnergy: "HIGH",
        item: {
          id: "habit-1",
          title: "Read",
          type: "HABIT",
          layer: "LIFE",
        },
      },
      {
        id: "check-in-monday",
        itemId: "habit-1",
        date: "2026-10-19",
        status: "REST",
        actualEnergy: null,
        item: {
          id: "habit-1",
          title: "Read",
          type: "HABIT",
          layer: "LIFE",
        },
      },
    ])
    latestActions.resolve([
      {
        id: "action-1",
        itemId: "habit-1",
        date: "2026-10-21",
        status: "COMPLETED",
        actualEnergy: "HIGH",
        actionText: "Read 20 pages",
        item: {
          id: "habit-1",
          title: "Read",
          type: "HABIT",
        },
      },
    ])
    completedTodos.resolve([
      {
        id: "todo-1",
        title: "Renew passport",
        customCategory: null,
        colorCode: null,
        category: { name: "Admin" },
        checkIns: [{ date: "2026-10-20" }],
        updatedAt: new Date("2026-10-20T12:00:00Z"),
        dueDate: null,
      },
    ])
    earliestCheckIn.resolve({ date: "2026-09-01" })

    // The streak query has started even though the slower aggregate read is
    // still pending.
    expect(allTimeStats).toBeDefined()
    expect(calculateItemStreaks).not.toHaveBeenCalled()

    allTimeStats.resolve(
      Array.from({ length: 15 }, (_, index) => ({
        date: `2026-09-${String(index + 1).padStart(2, "0")}`,
        _count: { id: 1 },
      }))
    )

    const history = await historyPromise

    expect(history).toMatchObject({
      todayStr,
      stage: "MATURE",
      overview: {
        totalCheckIns: 2,
        activeDaysCount: 15,
        maxCurrentStreak: 4,
        activeHabitsCount: 1,
        effectiveSpanDays: 51,
        defaultWindowWeeks: 16,
      },
      recentActions: [
        {
          id: "action-1",
          title: "Read",
          date: "2026-10-21",
          status: "COMPLETED",
          actualEnergy: "HIGH",
          actionText: "Read 20 pages",
        },
      ],
      activeItems: [
        {
          id: "habit-1",
          title: "Read",
          actionStreak: 3,
          rhythmStreak: 4,
          longestActionStreak: 5,
          maintainedDays: 0,
          totalCompletedCount: 2,
        },
      ],
      completedTodos: [
        {
          id: "todo-1",
          title: "Renew passport",
          customCategory: "Admin",
          completedDate: "2026-10-20",
        },
      ],
    })
    expect(history.heatmapDays).toHaveLength(112)
    expect(history.thisWeekDays.map((day) => day.dateStr)).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ])
    expect(history.activeItems[0].recent7Days[2]).toMatchObject({
      date: "2026-10-21",
      status: "COMPLETED",
      actualEnergy: "HIGH",
      isToday: true,
    })
    expect(calculateItemStreaks).toHaveBeenCalledWith("habit-1", todayStr, {
      item: habitItem,
      checkIns: [
        { itemId: "habit-1", date: "2026-10-21", status: "COMPLETED" },
        { itemId: "habit-1", date: "2026-10-20", status: "COMPLETED" },
      ],
    })
  })
})
