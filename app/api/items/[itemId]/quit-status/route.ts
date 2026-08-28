import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { recordQuitStatus } from "@/lib/api/checkin"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"
import { quitStatusSchema } from "@/lib/validations/checkin"

interface RouteProps {
  params: Promise<{ itemId: string }>
}

export async function POST(req: Request, { params }: RouteProps) {
  try {
    const { itemId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = quitStatusSchema.parse(json)

    const checkIn = await recordQuitStatus(
      session.user.id,
      itemId,
      body.date || (await getUserToday(session.user.id)),
      body.status,
      body.notes
    )

    return new Response(JSON.stringify(checkIn), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }
    if (error.message === "Item not found or unauthorized") {
      return new Response("Forbidden", { status: 403 })
    }
    if (error.message === "Item type does not support quit-habit check-ins") {
      return new Response("Invalid item type", { status: 409 })
    }
    return new Response("Internal Server Error", { status: 500 })
  }
}
