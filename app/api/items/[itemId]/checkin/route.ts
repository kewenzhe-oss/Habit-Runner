import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { recordHabitCheckIn } from "@/lib/api/checkin"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"
import { checkInCreateSchema } from "@/lib/validations/checkin"

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
    const body = checkInCreateSchema.parse(json)

    const date = body.date || (await getUserToday(session.user.id))
    const checkIn = await recordHabitCheckIn(session.user.id, itemId, date, {
      actualAmount: body.actualAmount,
      restReasonTag: body.restReasonTag,
      notes: body.notes,
    })

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
    if (error.message === "Item type does not support habit check-ins") {
      return new Response("Invalid item type", { status: 409 })
    }
    return new Response("Internal Server Error", { status: 500 })
  }
}
