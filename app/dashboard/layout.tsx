import { Metadata } from "next"

import { PRIVATE_ROBOTS } from "@/lib/seo"
import { AppLayout } from "@/components/layout/app-layout"

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return <AppLayout>{children}</AppLayout>
}
