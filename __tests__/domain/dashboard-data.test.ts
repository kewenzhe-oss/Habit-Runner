/** @jest-environment node */

import { getTodayDashboardData, recordHabitCheckIn } from "@/lib/api/checkin"
import { getUserItems } from "@/lib/api/items"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

jest.mock("@/env.mjs", () => ({ env: { ENABLE_DEMO_LOGIN: "false" } }))

jest.mock("@/lib/db", () => ({
  db: {
    dailyEnergyState: { findUnique: jest.fn() },
    checkIn: { findMany: jest.fn(), upsert: jest.fn() },
    item: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}))
jest.mock("@/lib/api/items", () => ({ getUserItems: jest.fn() }))

const item = {
  id: "habit",
  userId: "user",
  title: "Read",
  type: "HABIT",
  status: "ACTIVE",
  priority: "NORMAL",
  sortOrder: 0,
  layer: "LIFE",
  frequencyDays: null,
  createdAt: new Date("2026-10-01T00:00:00Z"),
  updatedAt: new Date("2026-10-01T00:00:00Z"),
  unitType: "COUNT",
  targetAmount: 10,
  unitLabel: "pages",
  actionPresets: [],
  toolLinks: [],
}

beforeEach(() => {
  jest.clearAllMocks()
})

it("starts independent dashboard reads together and maps the week and yesterday correctly", async () => {
  let resolveEnergy!: (data: null) => void
  ;(db.dailyEnergyState.findUnique as jest.Mock).mockReturnValue(
    new Promise((yes) => {
      resolveEnergy = yes
    })
  )
  ;(getUserItems as jest.Mock).mockResolvedValue([item])
  ;(db.checkIn.findMany as jest.Mock)
    .mockResolvedValueOnce([
      {
        id: "today",
        itemId: "habit",
        date: "2026-10-20",
        status: "COMPLETED",
        actualEnergy: "NORMAL",
        updatedAt: new Date("2026-10-20T12:00:00Z"),
      },
      {
        id: "yesterday",
        itemId: "habit",
        date: "2026-10-19",
        status: "COMPLETED",
        nextIntent: "Read chapter 2",
      },
    ])
    .mockResolvedValueOnce([])
  const result = getTodayDashboardData("user", "2026-10-20")
  expect(getUserItems).toHaveBeenCalledWith(
    "user",
    expect.objectContaining({ includeCheckInCount: false })
  )
  expect(db.checkIn.findMany).toHaveBeenCalledTimes(2)
  resolveEnergy(null)
  const dashboard = await result
  expect(dashboard.items[0].tomorrowHint).toBe("Read chapter 2")
  expect(dashboard.items[0].todayCheckIn?.id).toBe("today")
  expect(dashboard.items[0].recent7Days?.[1]).toMatchObject({
    date: "2026-10-20",
    isToday: true,
    status: "COMPLETED",
  })
})

it("verifies habit ownership once and returns persisted check-in metrics", async () => {
  ;(db.item.findFirst as jest.Mock).mockResolvedValue(item)
  ;(db.checkIn.upsert as jest.Mock).mockResolvedValue({
    id: "saved",
    status: "COMPLETED",
    actualEnergy: "LOW",
  })
  ;(db.checkIn.findMany as jest.Mock).mockResolvedValue([])
  const result = await recordHabitCheckIn("user", "habit", "2026-10-20", {
    actualAmount: 5,
  })
  expect(db.item.findFirst).toHaveBeenCalledTimes(1)
  expect(db.item.findFirst).toHaveBeenCalledWith({
    where: { id: "habit", userId: "user" },
  })
  expect(result).toMatchObject({ id: "saved", streaks: { actionStreak: 0 } })
})

it("keeps signed JWT identity without a profile database round trip", async () => {
  const token = { id: "user", email: "test@example.com", name: "Test" }
  const result = await authOptions.callbacks!.jwt!({ token } as never)
  expect(result).toEqual(token)
  expect(db.user.findUnique).not.toHaveBeenCalled()
})

it("rejects a habit belonging to another user before writing", async () => {
  ;(db.item.findFirst as jest.Mock).mockResolvedValue(null)
  await expect(
    recordHabitCheckIn("other", "habit", "2026-10-20", { actualAmount: 5 })
  ).rejects.toThrow("unauthorized")
  expect(db.checkIn.upsert).not.toHaveBeenCalled()
})

it("acknowledges a saved check-in even if optional streak loading fails", async () => {
  ;(db.item.findFirst as jest.Mock).mockResolvedValue(item)
  ;(db.checkIn.upsert as jest.Mock).mockResolvedValue({
    id: "persisted",
    status: "COMPLETED",
  })
  ;(db.checkIn.findMany as jest.Mock).mockRejectedValue(
    new Error("Read temporarily unavailable")
  )
  await expect(
    recordHabitCheckIn("user", "habit", "2026-10-20", { actualAmount: 5 })
  ).resolves.toMatchObject({ id: "persisted" })
})
