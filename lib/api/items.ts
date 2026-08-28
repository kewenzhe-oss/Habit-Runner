import { ItemStatus, ItemType, ItemWithDetails, Layer } from "@/types"
import { z } from "zod"

import { db } from "@/lib/db"
import { itemCreateSchema, itemUpdateSchema } from "@/lib/validations/item"

export async function getUserItems(
  userId: string,
  options?: {
    type?: ItemType
    layer?: Layer
    status?: ItemStatus | ItemStatus[]
  }
): Promise<ItemWithDetails[]> {
  const where: any = {
    userId,
  }

  if (options?.type) {
    where.type = options.type
  }

  if (options?.layer) {
    where.layer = options.layer
  }

  if (options?.status) {
    where.status = Array.isArray(options.status)
      ? { in: options.status }
      : options.status
  } else {
    // Default to active items unless specified
    where.status = { not: "ARCHIVED" }
  }

  const items = await db.item.findMany({
    where,
    include: {
      category: true,
      actionPresets: true,
      toolLinks: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { checkIns: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })

  return items as ItemWithDetails[]
}

export async function getUserItemById(
  itemId: string,
  userId: string
): Promise<ItemWithDetails | null> {
  const item = await db.item.findFirst({
    where: {
      id: itemId,
      userId,
    },
    include: {
      category: true,
      actionPresets: true,
      toolLinks: {
        orderBy: { sortOrder: "asc" },
      },
      checkIns: {
        orderBy: { date: "desc" },
        take: 365,
      },
    },
  })

  return item as ItemWithDetails | null
}

export async function createItem(
  userId: string,
  input: z.infer<typeof itemCreateSchema>
) {
  const { actionPresets, toolLinks, ...itemData } = input

  if (itemData.categoryId) {
    const category = await db.category.findFirst({
      where: { id: itemData.categoryId, userId },
    })
    if (!category) throw new Error("Category not found or unauthorized")
    itemData.customCategory = category.name
  }

  return await db.item.create({
    data: {
      ...itemData,
      userId,
      actionPresets: actionPresets?.length
        ? {
            create: actionPresets.map((preset) => ({
              energyLevel: preset.energyLevel,
              actionText: preset.actionText,
              description: preset.description,
            })),
          }
        : undefined,
      toolLinks: toolLinks?.length
        ? {
            create: toolLinks.map((tool, idx) => ({
              title: tool.title,
              url: tool.url,
              energyLevel:
                tool.energyLevel && tool.energyLevel !== "ANY"
                  ? (tool.energyLevel as any)
                  : null,
              description: tool.description,
              sortOrder: idx,
            })),
          }
        : undefined,
    },
    include: {
      actionPresets: true,
      toolLinks: true,
    },
  })
}

export async function updateItem(
  itemId: string,
  userId: string,
  input: z.infer<typeof itemUpdateSchema>
) {
  const { actionPresets, toolLinks, ...itemData } = input

  // Verify ownership
  const existing = await db.item.findFirst({
    where: { id: itemId, userId },
  })

  if (!existing) {
    return null
  }

  if (itemData.categoryId) {
    const category = await db.category.findFirst({
      where: { id: itemData.categoryId, userId },
    })
    if (!category) throw new Error("Category not found or unauthorized")
    itemData.customCategory = category.name
  }

  // Update item details
  const updated = await db.item.update({
    where: { id: itemId },
    data: {
      ...itemData,
      updatedAt: new Date(),
    },
  })

  // Update action presets if provided
  if (actionPresets !== undefined) {
    // Delete existing presets and recreate
    await db.energyActionPreset.deleteMany({
      where: { itemId },
    })

    if (actionPresets.length > 0) {
      await db.energyActionPreset.createMany({
        data: actionPresets.map((preset) => ({
          itemId,
          energyLevel: preset.energyLevel,
          actionText: preset.actionText,
          description: preset.description,
        })),
      })
    }
  }

  // Update tool links if provided
  if (toolLinks !== undefined) {
    await db.toolLink.deleteMany({
      where: { itemId },
    })

    if (toolLinks.length > 0) {
      await db.toolLink.createMany({
        data: toolLinks.map((tool, idx) => ({
          itemId,
          title: tool.title,
          url: tool.url,
          energyLevel:
            tool.energyLevel && tool.energyLevel !== "ANY"
              ? (tool.energyLevel as any)
              : null,
          description: tool.description,
          sortOrder: idx,
        })),
      })
    }
  }

  return getUserItemById(itemId, userId)
}

export async function archiveOrDeleteItem(
  itemId: string,
  userId: string,
  mode: "archive" | "delete" = "archive"
) {
  const existing = await db.item.findFirst({
    where: { id: itemId, userId },
  })

  if (!existing) {
    return false
  }

  if (mode === "delete") {
    await db.item.delete({
      where: { id: itemId },
    })
  } else {
    await db.item.update({
      where: { id: itemId },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    })
  }

  return true
}
