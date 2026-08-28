import { getServerSession } from "next-auth/next"

import { getWeeklyInsights } from "@/lib/api/insights"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"
import { addCalendarDays } from "@/lib/domain/date"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const defaultEnd = await getUserToday(session.user.id)
    const defaultStart = addCalendarDays(defaultEnd, -6)

    const startDate = searchParams.get("startDate") || defaultStart
    const endDate = searchParams.get("endDate") || defaultEnd

    const insights = await getWeeklyInsights(
      session.user.id,
      startDate,
      endDate
    )
    return new Response(JSON.stringify(insights), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 })
  }
}
