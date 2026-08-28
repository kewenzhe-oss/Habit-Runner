import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { authOptions } from "@/lib/auth"
import { getUserItemById } from "@/lib/api/items"
import { calculateItemStreaks } from "@/lib/api/checkin"
import { getItemTrendData } from "@/lib/api/trends"
import { Shell } from "@/components/layout/shell"
import { ItemDetailView } from "@/components/items/item-detail-view"
import { getUserToday } from "@/lib/api/user-date"

interface ItemDetailPageProps {
  params: Promise<{ itemId: string }>
}

export async function generateMetadata({ params }: ItemDetailPageProps): Promise<Metadata> {
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

  const todayStr = await getUserToday(user.id)
  const streaks = await calculateItemStreaks(item.id, todayStr)
  const initialTrendData = await getItemTrendData(item.id, user.id, 30)

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
