import { Metadata } from "next"

import { PRIVATE_ROBOTS } from "@/lib/seo"
import { AppLayout } from "@/components/layout/app-layout"

export const metadata: Metadata = { robots: PRIVATE_ROBOTS }

export default function PrivateAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
