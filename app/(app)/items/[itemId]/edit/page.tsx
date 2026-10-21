import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { authOptions } from "@/lib/auth"
import { getUserItemById } from "@/lib/api/items"
import { getDictionary } from "@/lib/i18n"
import { Shell } from "@/components/layout/shell"
import { ItemForm } from "@/components/items/item-form"

interface ItemEditPageProps {
  params: Promise<{ itemId: string }>
}

const dict = getDictionary("zh")

export const metadata: Metadata = {
  title: dict.item.editPage.title,
  description: dict.item.editPage.description,
}

export default async function ItemEditPage({ params }: ItemEditPageProps) {
  const { itemId } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/signin")
  }

  const item = await getUserItemById(itemId, user.id)

  if (!item) {
    notFound()
  }

  return (
    <Shell className="max-w-3xl">
      <ItemForm initialItem={item} mode="edit" />
    </Shell>
  )
}
