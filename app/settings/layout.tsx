import { Metadata } from "next"

import { PRIVATE_ROBOTS } from "@/lib/seo"
import { AppLayout } from "@/components/layout/app-layout"

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
}

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  return <AppLayout>{children}</AppLayout>
}
