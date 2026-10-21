import { Metadata } from "next"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"
import { Card } from "@/components/ui/card"
import { Shell } from "@/components/layout/shell"
import { AccountProfileCard } from "@/components/settings/account-profile-card"
import { AppearanceForm } from "@/components/settings/appearance-form"
import { DataBackupCard } from "@/components/settings/data-backup-card"
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
    <Shell className="max-w-3xl gap-5">
      <SettingsPageHeader />
      <div className="grid grid-cols-1 gap-4">
        <AccountProfileCard
          email={user.email ?? null}
          joinedAt={user.createdAt.toISOString()}
          timezone={user.timezone}
        />
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        <Card className="grid divide-y overflow-hidden min-[360px]:grid-cols-2 min-[360px]:divide-x min-[360px]:divide-y-0">
          <LanguageForm />
          <AppearanceForm />
        </Card>
        <DataBackupCard />
      </div>
    </Shell>
  )
}
