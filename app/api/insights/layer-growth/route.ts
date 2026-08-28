import { getServerSession } from "next-auth/next"

import { getLayerGrowthMatrix } from "@/lib/api/layer-growth"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const asOfDate = await getUserToday(session.user.id)
    const matrix = await getLayerGrowthMatrix(session.user.id, asOfDate)

    return Response.json(matrix)
  } catch {
    return new Response("Internal Server Error", { status: 500 })
  }
}
