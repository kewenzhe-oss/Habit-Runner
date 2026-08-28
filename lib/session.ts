import { getServerSession } from "next-auth/next"
import { Session } from "next-auth"

import { authOptions } from "@/lib/auth"

export async function getCurrentUser(): Promise<Session["user"] | undefined> {
  const session = await getServerSession(authOptions)

  return session?.user
}
