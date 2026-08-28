import { AppLayout } from "@/components/layout/app-layout"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return <AppLayout>{children}</AppLayout>
}
