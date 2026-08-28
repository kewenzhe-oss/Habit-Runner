import { AppLayout } from "@/components/layout/app-layout"

interface InsightsLayoutProps {
  children: React.ReactNode
}

export default async function InsightsLayout({
  children,
}: InsightsLayoutProps) {
  return <AppLayout>{children}</AppLayout>
}
