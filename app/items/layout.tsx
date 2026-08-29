import { Metadata } from "next"

import { PRIVATE_ROBOTS } from "@/lib/seo"
import { AppLayout } from "@/components/layout/app-layout"

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
}

interface ItemsLayoutProps {
  children: React.ReactNode
}

export default async function ItemsLayout({ children }: ItemsLayoutProps) {
  return <AppLayout>{children}</AppLayout>
}
