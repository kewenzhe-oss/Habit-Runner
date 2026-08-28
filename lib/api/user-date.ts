import { db } from "@/lib/db"
import { formatDateInTimeZone } from "@/lib/domain/date"

export async function getUserTimeZone(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  })
  return user?.timezone || "UTC"
}

export async function getUserToday(userId: string, now: Date = new Date()) {
  return formatDateInTimeZone(now, await getUserTimeZone(userId))
}
