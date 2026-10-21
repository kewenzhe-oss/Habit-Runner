import { Metadata } from "next"
import { redirect } from "next/navigation"

import { buildSignInUrl } from "@/lib/auth-redirect"
import { getDictionary } from "@/lib/i18n"
import { getCurrentUser } from "@/lib/session"
import { RestorableNewItemForm } from "@/components/items/restorable-new-item-form"
import { Shell } from "@/components/layout/shell"

const dict = getDictionary("zh")

export const metadata: Metadata = {
  title: dict.item.newPage.title,
  description: dict.item.newPage.description,
}

interface NewItemPageProps {
  searchParams?: Promise<{ restore?: string }>
}

export default async function NewItemPage({ searchParams }: NewItemPageProps) {
  const user = await getCurrentUser()
  const params = searchParams ? await searchParams : {}
  const shouldRestore = params.restore === "1"

  if (!user) {
    redirect(
      buildSignInUrl(shouldRestore ? "/items/new?restore=1" : "/items/new")
    )
  }

  return (
    <Shell className="max-w-3xl">
      <RestorableNewItemForm restore={shouldRestore} />
    </Shell>
  )
}
