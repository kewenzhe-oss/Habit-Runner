import { cache } from "react"
import { Session } from "next-auth"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const getCurrentUser = cache(
  async (): Promise<
    (Session["user"] & { timezone: string; createdAt: Date }) | undefined
  > => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return undefined

    // Share one fresh profile between layout, page and metadata in this render.
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        timezone: true,
        createdAt: true,
      },
    })
    return user ?? undefined
  }
)
