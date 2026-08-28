"use client"

import Link from "next/link"
import { User } from "next-auth"

import { buildSignInUrl } from "@/lib/auth-redirect"
import { getDictionary, Locale, useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import { UserAccountNav } from "./user-account-nav"

interface UserNavDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "name" | "image" | "email">
  isAuthenticated?: boolean
  locale?: Locale
}

export function UserNavDisplay({
  user,
  isAuthenticated = Boolean(user.email),
  locale: explicitLocale,
}: UserNavDisplayProps) {
  const i18n = useI18n()
  const dict = explicitLocale ? getDictionary(explicitLocale) : i18n.dict

  if (!isAuthenticated) {
    return (
      <Link
        href={buildSignInUrl("/dashboard")}
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
