"use client"

import { signOut } from "next-auth/react"

import { formatLocalizedDate, useI18n } from "@/lib/i18n"
import { triggerHaptic } from "@/lib/haptics"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface AccountProfileCardProps {
  email?: string | null
  joinedAt?: string | null
  timezone?: string | null
}

export function AccountProfileCard({
  email,
  joinedAt,
  timezone,
}: AccountProfileCardProps) {
  const { dict, locale, format } = useI18n()
  const copy = dict.item.settingsPage.account
  const joinedDate = joinedAt ? joinedAt.slice(0, 10) : ""

  return (
    <Card className="overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icons.userAlt aria-hidden="true" className="h-4 w-4" />
          </span>
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm min-[380px]:grid-cols-2">
          <div className="min-w-0 rounded-lg border bg-muted/20 px-3 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.email}
            </dt>
            <dd className="mt-1 break-all font-medium text-foreground">
              {email || copy.notAvailable}
            </dd>
          </div>
          <div className="min-w-0 rounded-lg border bg-muted/20 px-3 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.joined}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {joinedDate
                ? formatLocalizedDate(joinedDate, locale)
                : copy.notAvailable}
            </dd>
          </div>
          <div className="min-w-0 rounded-lg border bg-muted/20 px-3 py-2.5 min-[380px]:col-span-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.timezone}
            </dt>
            <dd className="mt-1 break-all font-medium text-foreground">
              {timezone || copy.notAvailable}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => {
            triggerHaptic("light")
            void signOut({ callbackUrl: "/signin" })
          }}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive transition-[background-color,transform] duration-150 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none sm:w-auto"
        >
          <Icons.signout aria-hidden="true" className="h-4 w-4" />
          {format(copy.signOut, { email: email || copy.notAvailable })}
        </button>
      </CardContent>
    </Card>
  )
}
