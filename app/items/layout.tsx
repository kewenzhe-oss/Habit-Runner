import { AppLayout } from "@/components/layout/app-layout"

interface ItemsLayoutProps {
  children: React.ReactNode
}

export default async function ItemsLayout({ children }: ItemsLayoutProps) {
  return <AppLayout>{children}</AppLayout>
}
