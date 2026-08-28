"use client"

import Link from "next/link"
import { User } from "next-auth"
import { signOut } from "next-auth/react"

import { getDictionary, Locale, useI18n } from "@/lib/i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/icons"
import { UserAvatar } from "@/components/user/user-avatar"

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "name" | "image" | "email">
  locale?: Locale
}

export function UserAccountNav({ user, locale: explicitLocale }: UserAccountNavProps) {
  const i18n = useI18n()
  const dict = explicitLocale ? getDictionary(explicitLocale) : i18n.dict

  const dashboardLinks = [
    { title: dict.nav.links.dashboard, href: "/dashboard", icon: "dashboard" as const },
    { title: dict.nav.links.insights, href: "/insights", icon: "history" as const },
    { title: dict.nav.links.settings, href: "/settings", icon: "settings" as const },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={dict.nav.actions.openAccountMenu}
        className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <UserAvatar
          user={{
            name: user.name || null,
            image: user.image || null,
          }}
          className="h-8 w-8"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        {dashboardLinks.map((item, index) => {
          const Icon = Icons[item.icon || "next"]
          return (
            item.href && (
              <DropdownMenuItem key={index} className="cursor-pointer" asChild>
                <Link href={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </DropdownMenuItem>
            )
          )
        })}

        {/* Quick Language Switcher: Only available in operation environment */}
        {!explicitLocale && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault()
                const nextLocale = i18n.locale === "zh" ? "en" : "zh"
                i18n.setLocale(nextLocale)
              }}
            >
              <Icons.globe className="mr-2 h-4 w-4" />
              <span>
                {i18n.locale === "zh" ? "Switch to English" : "切换为中文"}
              </span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            event.preventDefault()
            signOut({
              callbackUrl: `${window.location.origin}/signin`,
            })
          }}
        >
          <Icons.signout className="mr-2 h-4 w-4" />
          <span>{dict.nav.actions.signOut}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
