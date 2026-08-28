import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { todoStatusSchema } from "@/lib/validations/checkin"

interface RouteProps {
  params: Promise<{ itemId: string }>
}

export async function PATCH(req: Request, { params }: RouteProps) {
  try {
    const { itemId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = todoStatusSchema.parse(json)

    // Verify item
    const item = await db.item.findFirst({
      where: { id: itemId, userId: session.user.id },
    })

    if (!item) {
      return new Response("Forbidden", { status: 403 })
    }
    if (item.type !== "TODO") {
      return new Response("Invalid item type", { status: 409 })
    }

    const date = body.date || (await getUserToday(session.user.id))
    const recurrence = item.todoRecurrence || item.frequencyDays
    const isRecurring = recurrence === "WEEKLY" || recurrence === "MONTHLY"
    const nextItemStatus =
      body.status === "COMPLETED" && isRecurring ? "ACTIVE" : body.status

    const updated = await db.$transaction(async (tx) => {
      const nextItem = await tx.item.update({
        where: { id: itemId },
        data: { status: nextItemStatus, updatedAt: new Date() },
      })

      if (body.status === "COMPLETED") {
        await tx.checkIn.upsert({
          where: { itemId_date: { itemId, date } },
          update: {
            status: "COMPLETED",
            actualEnergy: body.actualEnergy || "NORMAL",
            completionRate: 100,
            actionText: `已完成：${item.title}`,
            notes: body.notes,
          },
          create: {
            userId: session.user.id,
            itemId,
            date,
            status: "COMPLETED",
            actualEnergy: body.actualEnergy || "NORMAL",
            completionRate: 100,
            actionText: `已完成：${item.title}`,
            notes: body.notes,
          },
        })
      } else if (body.status === "ACTIVE") {
        await tx.checkIn.deleteMany({
          where: { itemId, date, status: "COMPLETED" },
        })
      }

      return nextItem
    })

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }
    return new Response("Internal Server Error", { status: 500 })
  }
}
