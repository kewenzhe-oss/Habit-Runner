import { Metadata } from "next"
import { redirect } from "next/navigation"

import { PRIVATE_ROBOTS } from "@/lib/seo"

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
}

export default function TodayRedirect() {
  redirect("/dashboard")
}
