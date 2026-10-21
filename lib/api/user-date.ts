import { cache } from "react"

import { db } from "@/lib/db"
import { formatDateInTimeZone } from "@/lib/domain/date"

export const getUserTimeZone = cache(
  async (userId: string): Promise<string> => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    })
    return user?.timezone || "UTC"
  }
)

export async function getUserToday(
  userId: string,
  now: Date = new Date(),
  timeZone?: string
) {
  return formatDateInTimeZone(now, timeZone || (await getUserTimeZone(userId)))
}
