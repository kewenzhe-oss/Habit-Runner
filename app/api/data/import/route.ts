import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import { importUserData } from "@/lib/api/data-sync"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "Invalid backup data structure" }, { status: 400 })
    }

    const result = await importUserData(session.user.id, body)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Import data failed:", error)
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    )
  }
}
