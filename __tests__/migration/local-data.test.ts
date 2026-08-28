import {
  clearLocalData,
  dismissMigration,
  getMigrationStatus,
  getPendingLocalCheckIns,
  getPendingLocalData,
  isMigrationEligible,
  LEGACY_LOCAL_ITEMS_KEY,
  LOCAL_CHECKINS_KEY,
  LOCAL_ITEMS_KEY,
  markMigrationCompleted,
  PENDING_NEW_ITEM_KEY,
  saveLocalItem,
} from "@/lib/migration/local-data"

describe("local-data manager", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("reads pending draft and local item list correctly", () => {
    // 1. Save draft item
    localStorage.setItem(
      PENDING_NEW_ITEM_KEY,
      JSON.stringify({
        version: 1,
        createdAt: 1000,
        expiresAt: 50000,
        payload: {
          title: "早起喝水",
          type: "HABIT",
          targetAmount: 500,
          unitLabel: "毫升",
        },
      })
    )

    // 2. Save items list
    localStorage.setItem(
      LOCAL_ITEMS_KEY,
      JSON.stringify([
        {
          localId: "loc_1",
          payload: {
            title: "夜间阅读",
            type: "HABIT",
            targetAmount: 30,
          },
          createdAt: 2000,
          migrated: false,
        },
        {
          localId: "loc_2_migrated",
          payload: {
            title: "已迁移事项",
            type: "HABIT",
          },
          migrated: true, // Should be ignored
        },
      ])
    )

    const items = getPendingLocalData(localStorage)
    expect(items).toHaveLength(2)

    const titles = items.map((i) => i.payload.title)
    expect(titles).toContain("早起喝水")
    expect(titles).toContain("夜间阅读")
    expect(titles).not.toContain("已迁移事项")
  })

  it("extracts pending check-ins properly", () => {
    localStorage.setItem(
      LOCAL_CHECKINS_KEY,
      JSON.stringify([
        {
          itemTitle: "早起喝水",
          date: "2026-08-28",
          status: "COMPLETED",
          actualAmount: 500,
        },
      ])
    )

    const checkIns = getPendingLocalCheckIns(localStorage)
    expect(checkIns).toHaveLength(1)
    expect(checkIns[0].itemTitle).toBe("早起喝水")
    expect(checkIns[0].status).toBe("COMPLETED")
  })

  it("checks migration eligibility based on account and session dismissal", () => {
    const userEmail = "test@example.com"

    // Empty storage -> ineligible
    expect(isMigrationEligible(userEmail, localStorage)).toBe(false)

    // Add local item
    saveLocalItem(
      {
        title: "每日冥想",
        type: "HABIT",
      },
      localStorage
    )

    // Now eligible
    expect(isMigrationEligible(userEmail, localStorage)).toBe(true)

    // Test dismissal
    dismissMigration(userEmail, localStorage)
    expect(isMigrationEligible(userEmail, localStorage)).toBe(false)

    // Different user is still eligible
    expect(isMigrationEligible("other@example.com", localStorage)).toBe(true)
  })

  it("marks migration as completed and cleans up draft keys", () => {
    const userEmail = "test@example.com"

    localStorage.setItem(
      PENDING_NEW_ITEM_KEY,
      JSON.stringify({
        version: 1,
        createdAt: 1000,
        expiresAt: 50000,
        payload: { title: "临时草稿", type: "HABIT" },
      })
    )

    saveLocalItem({ title: "坚持锻炼", type: "HABIT" }, localStorage)

    expect(isMigrationEligible(userEmail, localStorage)).toBe(true)

    // Complete migration
    const success = markMigrationCompleted(
      userEmail,
      { itemsCount: 2 },
      localStorage
    )
    expect(success).toBe(true)

    // Draft key should be removed
    expect(localStorage.getItem(PENDING_NEW_ITEM_KEY)).toBeNull()

    // Status store should contain record
    const status = getMigrationStatus(localStorage)
    expect(status.accounts["test@example.com"]?.itemsCount).toBe(2)

    // Should no longer be eligible
    expect(isMigrationEligible(userEmail, localStorage)).toBe(false)
  })

  it("clears local data safely", () => {
    saveLocalItem({ title: "事项 1", type: "HABIT" }, localStorage)
    localStorage.setItem(LOCAL_CHECKINS_KEY, "[]")

    clearLocalData(localStorage)

    expect(localStorage.getItem(LOCAL_ITEMS_KEY)).toBeNull()
    expect(localStorage.getItem(LOCAL_CHECKINS_KEY)).toBeNull()
    expect(getPendingLocalData(localStorage)).toHaveLength(0)
  })
})
