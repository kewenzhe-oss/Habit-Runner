import { Metadata } from "next"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"
import { Shell } from "@/components/layout/shell"
import { AppearanceForm } from "@/components/settings/appearance-form"
import { LanguageForm } from "@/components/settings/language-form"
import { SettingsPageHeader } from "@/components/settings/settings-page-header"
import { UserNameForm } from "@/components/user/user-name-form"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile and display preferences.",
}

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/signin")
  }

  return (
    <Shell className="max-w-3xl space-y-6">
      <SettingsPageHeader />
      <div className="grid grid-cols-1 gap-6">
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        <LanguageForm />
        <AppearanceForm />
      </div>
    </Shell>
  )
}
