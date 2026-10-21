/** @jest-environment node */
import { getServerSession } from "next-auth/next"

import { recordHabitCheckIn, recordQuitStatus } from "@/lib/api/checkin"
import { POST as habitPost } from "@/app/api/items/[itemId]/checkin/route"
import { POST as quitPost } from "@/app/api/items/[itemId]/quit-status/route"

jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }))
jest.mock("@/lib/auth", () => ({ authOptions: {} }))
jest.mock("@/lib/api/checkin", () => ({
  recordHabitCheckIn: jest.fn(),
  recordQuitStatus: jest.fn(),
}))
jest.mock("@/lib/api/user-date", () => ({ getUserToday: jest.fn() }))
const context = { params: Promise.resolve({ itemId: "item-1" }) }
describe.each([
  [
    "habit",
    habitPost,
    recordHabitCheckIn,
    { actualAmount: 1, date: "2026-10-21" },
  ],
  ["quit", quitPost, recordQuitStatus, { status: "KEPT", date: "2026-10-21" }],
] as const)("%s save timings", (_, post, save, body) => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  it("reports timings and prevents caching private responses", async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-1" },
    })
    ;(save as jest.Mock).mockResolvedValue({ id: "record-1" })
    const response = await post(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify(body),
      }),
      context
    )
    expect(response.status).toBe(200)
    expect(response.headers.get("Server-Timing")).toMatch(
      /auth;dur=[\d.]+, save_and_streaks;dur=[\d.]+/
    )
    expect(response.headers.get("Server-Timing")).not.toContain("user-1")
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(await response.json()).toEqual({ id: "record-1" })
  })
  it("rejects unauthenticated writes before saving", async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const response = await post(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify(body),
      }),
      context
    )
    expect(response.status).toBe(401)
    expect(save).not.toHaveBeenCalled()
  })
})
