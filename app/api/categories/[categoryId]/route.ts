import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { deleteCategory, updateCategory } from "@/lib/api/categories"
import { authOptions } from "@/lib/auth"

const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(32).optional(),
  colorCode: z.string().optional(),
})

interface RouteProps {
  params: Promise<{ categoryId: string }>
}

export async function PATCH(req: Request, { params }: RouteProps) {
  try {
    const { categoryId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      })
    }

    const json = await req.json()
    const body = categoryUpdateSchema.parse(json)

    const updated = await updateCategory(categoryId, session.user.id, body)
    if (!updated) {
      return new Response(JSON.stringify({ error: "Category not found" }), {
        status: 404,
      })
    }

    return new Response(JSON.stringify(updated), { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}

export async function DELETE(req: Request, { params }: RouteProps) {
  try {
    const { categoryId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      })
    }

    const success = await deleteCategory(categoryId, session.user.id)
    if (!success) {
      return new Response(JSON.stringify({ error: "Category not found" }), {
        status: 404,
      })
    }

    return new Response(null, { status: 204 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}
