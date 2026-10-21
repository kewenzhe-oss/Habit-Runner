import { getServerSession } from "next-auth/next"

import { getTodayDashboardData } from "@/lib/api/checkin"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"
import { createServerTiming } from "@/lib/server-timing"

export async function GET(req: Request) {
  try {
    const timing = createServerTiming()
    const session = await timing.measure("auth", () =>
      getServerSession(authOptions)
    )
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date =
      searchParams.get("date") || (await getUserToday(session.user.id))

    const dashboard = await timing.measure("dashboard", () =>
      getTodayDashboardData(session.user.id, date)
    )
    return new Response(JSON.stringify(dashboard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Server-Timing": timing.header(),
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 })
  }
}
