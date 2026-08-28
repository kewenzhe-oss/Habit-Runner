import { LayerGrowthMatrixData } from "@/types"

import { getUserTimeZone } from "@/lib/api/user-date"
import { db } from "@/lib/db"
import { createdAtCalendarDate } from "@/lib/domain/date"
import {
  buildLayerGrowthMatrix,
  getLayerGrowthPeriods,
  LayerGrowthCheckInInput,
  LayerGrowthItemInput,
} from "@/lib/domain/layer-growth"

export async function getLayerGrowthMatrix(
  userId: string,
  asOfDate: string
): Promise<LayerGrowthMatrixData> {
  const periods = getLayerGrowthPeriods(asOfDate)
  const [timeZone, items, checkIns] = await Promise.all([
    getUserTimeZone(userId),
    db.item.findMany({
      where: { userId },
      select: {
        id: true,
        layer: true,
        type: true,
        status: true,
        createdAt: true,
        archivedAt: true,
        frequencyDays: true,
        targetPerWeek: true,
        dueDate: true,
        todoRecurrence: true,
      },
    }),
    db.checkIn.findMany({
      where: {
        userId,
        date: { gte: periods.stability12Weeks.from, lte: asOfDate },
      },
      select: { itemId: true, date: true, status: true },
      orderBy: { date: "asc" },
    }),
  ])

  const itemInputs: LayerGrowthItemInput[] = items.map((item) => ({
    id: item.id,
    layer: item.layer,
    type: item.type,
    status: item.status,
    createdDate: createdAtCalendarDate(item.createdAt, timeZone),
    archivedDate: item.archivedAt
      ? createdAtCalendarDate(item.archivedAt, timeZone)
      : null,
    frequencyDays: item.frequencyDays,
    targetPerWeek: item.targetPerWeek,
    dueDate: item.dueDate,
    todoRecurrence: item.todoRecurrence,
  }))
  const checkInInputs: LayerGrowthCheckInInput[] = checkIns.map((checkIn) => ({
    itemId: checkIn.itemId,
    date: checkIn.date,
    status: checkIn.status,
  }))

  return buildLayerGrowthMatrix({
    asOfDate,
    items: itemInputs,
    checkIns: checkInInputs,
  })
}
