import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { calculateItemStreaks } from "@/lib/api/checkin"
import { getUserItemById } from "@/lib/api/items"
import { getItemTrendData } from "@/lib/api/trends"
import { getUserToday } from "@/lib/api/user-date"
import { authOptions } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"
import { ItemDetailView } from "@/components/items/item-detail-view"
import { Shell } from "@/components/layout/shell"

interface ItemDetailPageProps {
  params: Promise<{ itemId: string }>
}

export async function generateMetadata({
  params,
}: ItemDetailPageProps): Promise<Metadata> {
  const { itemId } = await params
  const user = await getCurrentUser()
  if (!user) return { title: "Item Detail" }

  const item = await getUserItemById(itemId, user.id)
  return {
    title: item?.title || "Item Detail",
  }
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { itemId } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/signin")
  }

  const item = await getUserItemById(itemId, user.id)

  if (!item) {
    notFound()
  }

  const todayStr = await getUserToday(user.id, new Date(), user.timezone)
  const [streaks, initialTrendData] = await Promise.all([
    calculateItemStreaks(item.id, todayStr, {
      item,
      checkIns: item.checkIns?.slice(0, 120),
    }),
    getItemTrendData(item.id, user.id, 30, item, user.timezone),
  ])

  return (
    <Shell>
      <ItemDetailView
        item={item}
        streaks={streaks}
        initialTrendData={initialTrendData}
      />
    </Shell>
  )
}
