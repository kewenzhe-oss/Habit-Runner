import { Metadata } from "next"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"
import { getDictionary } from "@/lib/i18n"
import { ItemForm } from "@/components/items/item-form"
import { Shell } from "@/components/layout/shell"

const dict = getDictionary("zh")

export const metadata: Metadata = {
  title: dict.item.newPage.title,
  description: dict.item.newPage.description,
}

export default async function NewItemPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/signin")
  }

  return (
    <Shell className="max-w-3xl">
      <ItemForm mode="create" />
    </Shell>
  )
}
