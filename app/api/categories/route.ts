import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { createCategory, getUserCategories } from "@/lib/api/categories"
import { authOptions } from "@/lib/auth"

const categoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(32),
  colorCode: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify([]), { status: 200 })
    }

    const categories = await getUserCategories(session.user.id)
    return new Response(JSON.stringify(categories), { status: 200 })
  } catch (error: any) {
    console.error("GET /api/categories error:", error)
    return new Response(JSON.stringify([]), { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      })
    }

    const json = await req.json()
    const body = categoryCreateSchema.parse(json)

    const category = await createCategory(
      session.user.id,
      body.name,
      body.colorCode
    )
    return new Response(JSON.stringify(category), { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}
