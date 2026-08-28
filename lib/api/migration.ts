import { db } from "@/lib/db"
import { createItem, updateItem } from "@/lib/api/items"
import { MigrationMergeInput } from "@/lib/validations/migration"

export interface MigrationMergeResult {
  success: boolean
  mergedCount: number
  overwrittenCount: number
  skippedCount: number
  processedItemIds: string[]
}

/**
 * Executes migration merge operations atomically for the authenticated user.
 */
export async function executeMigrationMerge(
  userId: string,
  input: MigrationMergeInput
): Promise<MigrationMergeResult> {
  let mergedCount = 0
  let overwrittenCount = 0
  let skippedCount = 0
  const processedItemIds: string[] = []

  for (const op of input.operations) {
    if (op.action === "skip") {
      skippedCount++
      continue
    }

    if (op.action === "overwrite" && op.targetCloudItemId) {
      // Verify ownership before overwrite
      const existing = await db.item.findFirst({
        where: { id: op.targetCloudItemId, userId },
      })

      if (existing) {
        const updated = await updateItem(op.targetCloudItemId, userId, op.itemData)
        if (updated) {
          overwrittenCount++
          processedItemIds.push(op.targetCloudItemId)

          // Insert any non-duplicate check-ins
          if (op.checkIns && op.checkIns.length > 0) {
            for (const ci of op.checkIns) {
              await db.checkIn.upsert({
                where: {
                  itemId_date: {
                    itemId: op.targetCloudItemId,
                    date: ci.date,
                  },
                },
                create: {
                  userId,
                  itemId: op.targetCloudItemId,
                  date: ci.date,
                  status: ci.status,
                  plannedEnergy: ci.plannedEnergy ?? null,
                  actualEnergy: ci.actualEnergy ?? null,
                  actionText: ci.actionText ?? null,
                  actualAmount: ci.actualAmount ?? null,
                  notes: ci.notes ?? null,
                },
                update: {
                  status: ci.status,
                  actualEnergy: ci.actualEnergy ?? undefined,
                  actionText: ci.actionText ?? undefined,
                  actualAmount: ci.actualAmount ?? undefined,
                },
              })
            }
          }
          continue
        }
      }
    }

    // "create" or "keep_both"
    let itemDataToCreate = { ...op.itemData }
    if (op.action === "keep_both" && op.customTitleSuffix) {
      itemDataToCreate.title = `${itemDataToCreate.title}${op.customTitleSuffix}`
    }

    // Resolve category if needed
    if (itemDataToCreate.customCategory && !itemDataToCreate.categoryId) {
      const existingCat = await db.category.findFirst({
        where: { userId, name: itemDataToCreate.customCategory },
      })
      if (existingCat) {
        itemDataToCreate.categoryId = existingCat.id
      }
    }

    const created = await createItem(userId, itemDataToCreate)
    if (created) {
      mergedCount++
      processedItemIds.push(created.id)

      // Insert any associated check-ins
      if (op.checkIns && op.checkIns.length > 0) {
        for (const ci of op.checkIns) {
          try {
            await db.checkIn.create({
              data: {
                userId,
                itemId: created.id,
                date: ci.date,
                status: ci.status,
                plannedEnergy: ci.plannedEnergy ?? null,
                actualEnergy: ci.actualEnergy ?? null,
                actionText: ci.actionText ?? null,
                actualAmount: ci.actualAmount ?? null,
                notes: ci.notes ?? null,
              },
            })
          } catch {
            // ignore duplicate checkin on same item/date
          }
        }
      }
    }
  }

  return {
    success: true,
    mergedCount,
    overwrittenCount,
    skippedCount,
    processedItemIds,
  }
}
