import { getServerSession } from "next-auth/next"

import { getItemTrendData } from "@/lib/api/trends"
import { authOptions } from "@/lib/auth"

interface RouteProps {
  params: Promise<{ itemId: string }>
}

export async function GET(req: Request, { params }: RouteProps) {
  try {
    const { itemId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      })
    }

    const { searchParams } = new URL(req.url)
    const rangeParam = searchParams.get("range")
    const rangeDays = rangeParam === "90" ? 90 : 30

    const data = await getItemTrendData(itemId, session.user.id, rangeDays)

    if (!data) {
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
      })
    }

    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}
