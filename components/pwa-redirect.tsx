"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

export function PWARedirect() {
  const router = useRouter()

  // Redirect to dashboard if running in standalone PWA mode
  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      router.replace("/dashboard")
    }
  }, [router])

  return null
}
