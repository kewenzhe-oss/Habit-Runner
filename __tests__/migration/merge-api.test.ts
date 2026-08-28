import { executeMigrationMerge } from "@/lib/api/migration"
import { db } from "@/lib/db"
import { createItem, updateItem } from "@/lib/api/items"

jest.mock("@/lib/db", () => ({
  db: {
    item: {
      findFirst: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    checkIn: {
      create: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock("@/lib/api/items", () => ({
  createItem: jest.fn(),
  updateItem: jest.fn(),
}))

describe("executeMigrationMerge", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("handles create, overwrite, keep_both, and skip operations correctly", async () => {
    const userId = "user_123"

    ;(createItem as jest.Mock).mockImplementation(async (_, input) => ({
      id: `created_${input.title}`,
      ...input,
    }))

    ;(db.item.findFirst as jest.Mock).mockResolvedValue({
      id: "cloud_item_1",
      userId,
      title: "已有习惯",
    })

    ;(updateItem as jest.Mock).mockResolvedValue({
      id: "cloud_item_1",
      title: "更新后的习惯",
    })

    const input = {
      operations: [
        // 1. Create
        {
          localId: "loc_1",
          action: "create" as const,
          itemData: {
            title: "早起晨练",
            type: "HABIT" as const,
            layer: "BODY" as const,
            targetAmount: 30,
          },
          checkIns: [
            {
              date: "2026-08-28",
              status: "COMPLETED" as const,
            },
          ],
        },
        // 2. Keep Both
        {
          localId: "loc_2",
          action: "keep_both" as const,
          customTitleSuffix: " (本地导入)",
          itemData: {
            title: "同名习惯",
            type: "HABIT" as const,
            layer: "LIFE" as const,
          },
        },
        // 3. Overwrite
        {
          localId: "loc_3",
          action: "overwrite" as const,
          targetCloudItemId: "cloud_item_1",
          itemData: {
            title: "已有习惯",
            type: "HABIT" as const,
            layer: "LIFE" as const,
            targetAmount: 45,
          },
        },
        // 4. Skip
        {
          localId: "loc_4",
          action: "skip" as const,
          itemData: {
            title: "跳过的事项",
            type: "HABIT" as const,
            layer: "LIFE" as const,
          },
        },
      ],
    }

    const result = await executeMigrationMerge(userId, input)

    expect(result.success).toBe(true)
    expect(result.mergedCount).toBe(2) // 1 create + 1 keep_both
    expect(result.overwrittenCount).toBe(1)
    expect(result.skippedCount).toBe(1)

    // Check create calls
    expect(createItem).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ title: "早起晨练" })
    )
    expect(createItem).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ title: "同名习惯 (本地导入)" })
    )

    // Check update calls
    expect(updateItem).toHaveBeenCalledWith(
      "cloud_item_1",
      userId,
      expect.objectContaining({ targetAmount: 45 })
    )

    // Check checkIn creation
    expect(db.checkIn.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        itemId: "created_早起晨练",
        date: "2026-08-28",
        status: "COMPLETED",
      }),
    })
  })
})
