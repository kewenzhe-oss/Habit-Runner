import { getServerSession } from "next-auth/next"
import { z } from "zod"

import {
  archiveOrDeleteItem,
  getUserItemById,
  updateItem,
} from "@/lib/api/items"
import { authOptions } from "@/lib/auth"
import { itemUpdateSchema } from "@/lib/validations/item"

interface RouteProps {
  params: Promise<{ itemId: string }>
}

export async function GET(req: Request, { params }: RouteProps) {
  try {
    const { itemId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const item = await getUserItemById(itemId, session.user.id)
    if (!item) {
      return new Response("Not Found", { status: 404 })
    }

    return new Response(JSON.stringify(item), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: RouteProps) {
  try {
    const { itemId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = itemUpdateSchema.parse(json)

    const updated = await updateItem(itemId, session.user.id, body)
    if (!updated) {
      return new Response("Not Found", { status: 404 })
    }

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

export async function DELETE(req: Request, { params }: RouteProps) {
  try {
    const { itemId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const permanent = searchParams.get("permanent") === "true"

    const success = await archiveOrDeleteItem(
      itemId,
      session.user.id,
      permanent ? "delete" : "archive"
    )

    if (!success) {
      return new Response("Not Found", { status: 404 })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 })
  }
}
