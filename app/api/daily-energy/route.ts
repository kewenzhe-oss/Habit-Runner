import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { setDailyEnergy } from "@/lib/api/checkin"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { dailyEnergySchema } from "@/lib/validations/checkin"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")

    if (!date) {
      return new Response("Date parameter required", { status: 400 })
    }

    const dailyEnergy = await db.dailyEnergyState.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date,
        },
      },
    })

    return new Response(JSON.stringify(dailyEnergy), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = dailyEnergySchema.parse(json)

    const updated = await setDailyEnergy(
      session.user.id,
      body.date,
      body.energyLevel,
      body.note
    )

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }
    return new Response("Internal Server Error", { status: 500 })
  }
}
