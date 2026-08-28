import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { executeMigrationMerge } from "@/lib/api/migration"
import { authOptions } from "@/lib/auth"
import { migrationMergeSchema } from "@/lib/validations/migration"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = migrationMergeSchema.parse(json)

    const result = await executeMigrationMerge(session.user.id, body)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }
    console.error("Migration merge error", error)
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
