import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { userNameSchema } from "@/lib/validations/user"

interface RouteProps {
  params: Promise<{ userId: string }>
}

export async function PATCH(req: Request, { params }: RouteProps) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || userId !== session?.user.id) {
      return new Response(null, { status: 403 })
    }

    // Edit user info based on input
    const body = await req.json()
    const payload = userNameSchema.parse(body)

    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: payload.name,
        timezone: payload.timezone,
        updatedAt: new Date(),
      },
    })

    return new Response(null, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }

    return new Response(null, { status: 500 })
  }
}
