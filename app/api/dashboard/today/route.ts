import { getServerSession } from "next-auth/next"

import { getTodayDashboardData } from "@/lib/api/checkin"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date =
      searchParams.get("date") || (await getUserToday(session.user.id))

    const dashboard = await getTodayDashboardData(session.user.id, date)
    return new Response(JSON.stringify(dashboard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 })
  }
}
