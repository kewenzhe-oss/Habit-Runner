import {
  PENDING_NEW_ITEM_KEY,
  PENDING_NEW_ITEM_TTL_MS,
  readPendingNewItem,
  savePendingNewItem,
} from "@/lib/pending-new-item"

const payload = {
  title: "Read one chapter",
  type: "HABIT" as const,
  layer: "SIGNAL" as const,
  unitType: "COUNT" as const,
  targetAmount: 1,
  unitLabel: "chapter",
  frequencyDays: "0,1,2,3,4,5,6",
  targetPerWeek: 7,
}

describe("pending new item storage", () => {
  beforeEach(() => localStorage.clear())

  it("round-trips the complete validated payload within thirty minutes", () => {
    expect(savePendingNewItem(payload, localStorage, 1_000)).toBe(true)
    expect(readPendingNewItem(localStorage, 2_000)).toEqual({
      status: "valid",
      value: {
        version: 1,
        createdAt: 1_000,
        expiresAt: 1_000 + PENDING_NEW_ITEM_TTL_MS,
        payload,
      },
    })
  })

  it("clears expired and malformed drafts", () => {
    savePendingNewItem(payload, localStorage, 1_000)
    expect(
      readPendingNewItem(localStorage, 1_000 + PENDING_NEW_ITEM_TTL_MS)
    ).toEqual({ status: "expired" })
    expect(localStorage.getItem(PENDING_NEW_ITEM_KEY)).toBeNull()

    localStorage.setItem(PENDING_NEW_ITEM_KEY, "not-json")
    expect(readPendingNewItem(localStorage, 2_000)).toEqual({
      status: "invalid",
    })
    expect(localStorage.getItem(PENDING_NEW_ITEM_KEY)).toBeNull()
  })

  it("fails safely when browser storage is blocked", () => {
    const blockedStorage = {
      getItem: () => {
        throw new Error("blocked")
      },
      removeItem: () => {
        throw new Error("blocked")
      },
      setItem: () => {
        throw new Error("blocked")
      },
    } as unknown as Storage

    expect(savePendingNewItem(payload, blockedStorage)).toBe(false)
    expect(readPendingNewItem(blockedStorage)).toEqual({ status: "invalid" })
  })
})
