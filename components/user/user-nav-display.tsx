"use client"

import Link from "next/link"
import { User } from "next-auth"

import { cn } from "@/lib/utils"
import { getDictionary, Locale, useI18n } from "@/lib/i18n"
import { buttonVariants } from "@/components/ui/button"

import { UserAccountNav } from "./user-account-nav"

interface UserNavDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "name" | "image" | "email">
  locale?: Locale
}

export function UserNavDisplay({ user, locale: explicitLocale }: UserNavDisplayProps) {
  const i18n = useI18n()
  const dict = explicitLocale ? getDictionary(explicitLocale) : i18n.dict

  if (user.email === null || user.email === undefined) {
    return (
      <Link
        href="/signin"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        {dict.nav.actions.signIn}
      </Link>
    )
  }

  return (
    <UserAccountNav
      user={{
        name: user.name,
        image: user.image,
        email: user.email,
      }}
      locale={explicitLocale}
    />
  )
}
