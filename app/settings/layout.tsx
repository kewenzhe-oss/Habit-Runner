import { AppLayout } from "@/components/layout/app-layout"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  return <AppLayout>{children}</AppLayout>
}
