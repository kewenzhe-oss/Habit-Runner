import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { createItem, getUserItems } from "@/lib/api/items"
import { authOptions } from "@/lib/auth"
import { itemCreateSchema } from "@/lib/validations/item"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") as any
    const layer = searchParams.get("layer") as any
    const status = searchParams.get("status") as any

    const items = await getUserItems(session.user.id, { type, layer, status })
    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = itemCreateSchema.parse(json)

    const item = await createItem(session.user.id, body)
    return new Response(JSON.stringify(item), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }
    return new Response("Internal Server Error", { status: 500 })
  }
}
