import {
  CheckInStatus,
  EnergyLevel,
  ItemStatus,
  ItemType,
  Layer,
} from "@prisma/client"
import { db } from "@/lib/db"

export interface UserBackupData {
  version: "1.0"
  exportedAt: string
  userEmail: string
  categories: Array<{
    name: string
    colorCode?: string | null
    icon?: string | null
    sortOrder?: number
  }>
  items: Array<{
    title: string
    whyPrompt?: string | null
    type: ItemType
    layer: Layer
    customCategory?: string | null
    status?: ItemStatus
    unitType?: string | null
    targetAmount?: number | null
    unitLabel?: string | null
    frequencyDays?: string | null
    targetPerWeek?: number | null
    dueDate?: string | null
    triggerCue?: string | null
    quitContext?: string | null
    highRiskWindow?: string | null
    todoRecurrence?: string | null
    sortOrder?: number
    colorCode?: string | null
    actionPresets?: Array<{
      energyLevel: EnergyLevel
      actionText: string
      description?: string | null
    }>
    toolLinks?: Array<{
      title: string
      url: string
      energyLevel?: EnergyLevel | null
      description?: string | null
      sortOrder?: number
    }>
  }>
  checkIns: Array<{
    itemTitle: string
    date: string
    status: CheckInStatus
    plannedEnergy?: EnergyLevel | null
    actualEnergy?: EnergyLevel | null
    actionText?: string | null
    actualAmount?: number | null
    completionRate?: number | null
    restReasonTag?: string | null
    notes?: string | null
  }>
  dailyEnergyStates: Array<{
    date: string
    energyLevel: EnergyLevel
    note?: string | null
  }>
}

export async function exportUserData(userId: string): Promise<UserBackupData> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      categories: true,
      items: {
        include: {
          actionPresets: true,
          toolLinks: true,
        },
      },
      checkIns: {
        include: {
          item: {
            select: { title: true },
          },
        },
      },
      dailyEnergyStates: true,
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    userEmail: user.email || "",
    categories: user.categories.map((c) => ({
      name: c.name,
      colorCode: c.colorCode,
      icon: c.icon,
      sortOrder: c.sortOrder,
    })),
    items: user.items.map((i) => ({
      title: i.title,
      whyPrompt: i.whyPrompt,
      type: i.type,
      layer: i.layer,
      customCategory: i.customCategory,
      status: i.status,
      unitType: i.unitType,
      targetAmount: i.targetAmount,
      unitLabel: i.unitLabel,
      frequencyDays: i.frequencyDays,
      targetPerWeek: i.targetPerWeek,
      dueDate: i.dueDate,
      triggerCue: i.triggerCue,
      quitContext: i.quitContext,
      highRiskWindow: i.highRiskWindow,
      todoRecurrence: i.todoRecurrence,
      sortOrder: i.sortOrder,
      colorCode: i.colorCode,
      actionPresets: i.actionPresets.map((ap) => ({
        energyLevel: ap.energyLevel,
        actionText: ap.actionText,
        description: ap.description,
      })),
      toolLinks: i.toolLinks.map((tl) => ({
        title: tl.title,
        url: tl.url,
        energyLevel: tl.energyLevel,
        description: tl.description,
        sortOrder: tl.sortOrder,
      })),
    })),
    checkIns: user.checkIns.map((ci) => ({
      itemTitle: ci.item.title,
      date: ci.date,
      status: ci.status,
      plannedEnergy: ci.plannedEnergy,
      actualEnergy: ci.actualEnergy,
      actionText: ci.actionText,
      actualAmount: ci.actualAmount,
      completionRate: ci.completionRate,
      restReasonTag: ci.restReasonTag,
      notes: ci.notes,
    })),
    dailyEnergyStates: user.dailyEnergyStates.map((de) => ({
      date: de.date,
      energyLevel: de.energyLevel,
      note: de.note,
    })),
  }
}

export async function importUserData(
  userId: string,
  backup: UserBackupData
): Promise<{ itemsImported: number; checkInsImported: number }> {
  // 1. Categories
  const existingCategories = await db.category.findMany({ where: { userId } })
  for (const cat of backup.categories || []) {
    const exists = existingCategories.find((c) => c.name === cat.name)
    if (!exists) {
      await db.category.create({
        data: {
          userId,
          name: cat.name,
          colorCode: cat.colorCode,
          icon: cat.icon,
          sortOrder: cat.sortOrder ?? 0,
        },
      })
    }
  }

  // 2. Items
  const existingItems = await db.item.findMany({ where: { userId } })
  const itemIdMap = new Map<string, string>() // title -> id
  let itemsImported = 0

  for (const item of backup.items || []) {
    let targetItemId: string
    const existing = existingItems.find(
      (i) => i.title === item.title && i.type === item.type
    )

    if (!existing) {
      const created = await db.item.create({
        data: {
          userId,
          title: item.title,
          whyPrompt: item.whyPrompt,
          type: item.type,
          layer: item.layer || "LIFE",
          customCategory: item.customCategory,
          status: item.status || "ACTIVE",
          unitType: item.unitType,
          targetAmount: item.targetAmount,
          unitLabel: item.unitLabel,
          frequencyDays: item.frequencyDays,
          targetPerWeek: item.targetPerWeek,
          dueDate: item.dueDate,
          triggerCue: item.triggerCue,
          quitContext: item.quitContext,
          highRiskWindow: item.highRiskWindow,
          todoRecurrence: item.todoRecurrence,
          sortOrder: item.sortOrder ?? 0,
          colorCode: item.colorCode,
          actionPresets: {
            create: (item.actionPresets || []).map((ap) => ({
              energyLevel: ap.energyLevel,
              actionText: ap.actionText,
              description: ap.description,
            })),
          },
          toolLinks: {
            create: (item.toolLinks || []).map((tl) => ({
              title: tl.title,
              url: tl.url,
              energyLevel: tl.energyLevel,
              description: tl.description,
              sortOrder: tl.sortOrder ?? 0,
            })),
          },
        },
      })
      targetItemId = created.id
      itemsImported++
    } else {
      targetItemId = existing.id
    }
    itemIdMap.set(item.title, targetItemId)
  }

  // 3. Check-ins
  let checkInsImported = 0
  for (const checkIn of backup.checkIns || []) {
    const targetItemId = itemIdMap.get(checkIn.itemTitle)
    if (!targetItemId) continue

    const existingCheckIn = await db.checkIn.findUnique({
      where: {
        itemId_date: {
          itemId: targetItemId,
          date: checkIn.date,
        },
      },
    })

    if (!existingCheckIn) {
      await db.checkIn.create({
        data: {
          userId,
          itemId: targetItemId,
          date: checkIn.date,
          status: checkIn.status,
          plannedEnergy: checkIn.plannedEnergy,
          actualEnergy: checkIn.actualEnergy,
          actionText: checkIn.actionText,
          actualAmount: checkIn.actualAmount,
          completionRate: checkIn.completionRate,
          restReasonTag: checkIn.restReasonTag,
          notes: checkIn.notes,
        },
      })
      checkInsImported++
    }
  }

  // 4. Daily Energy
  for (const energy of backup.dailyEnergyStates || []) {
    const existing = await db.dailyEnergyState.findUnique({
      where: {
        userId_date: {
          userId,
          date: energy.date,
        },
      },
    })

    if (!existing) {
      await db.dailyEnergyState.create({
        data: {
          userId,
          date: energy.date,
          energyLevel: energy.energyLevel,
          note: energy.note,
        },
      })
    }
  }

  return { itemsImported, checkInsImported }
}
