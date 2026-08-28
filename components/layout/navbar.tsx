"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User } from "next-auth"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { getDictionary, Locale, useI18n } from "@/lib/i18n"
import { QuickAddHabitModal } from "@/components/dashboard/quick-add-habit-modal"
import { Icons } from "@/components/icons"
import { UserNavDisplay } from "@/components/user/user-nav-display"

interface NavbarProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "name" | "image" | "email">
  locale?: Locale
}

export default function Navbar({ user, locale: explicitLocale }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const i18n = useI18n()

  // If explicitly passed (e.g. public frontpage layout), use that fixed dictionary.
  // Otherwise use the active App operation environment dictionary.
  const dict = explicitLocale ? getDictionary(explicitLocale) : i18n.dict

  const navLinks = [
    { title: dict.nav.links.dashboard, href: "/dashboard" },
    { title: dict.nav.links.insights, href: "/insights" },
    { title: dict.nav.links.settings, href: "/settings" },
  ]

  const mobileLinks = [
    { title: dict.nav.links.dashboard, href: "/dashboard", icon: "dashboard" as const },
    { title: dict.nav.links.insights, href: "/insights", icon: "history" as const },
    { title: dict.nav.links.settings, href: "/settings", icon: "settings" as const },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 w-full select-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-16 items-center justify-between px-4 md:px-8 lg:max-w-7xl">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground shadow-sm">
                <Icons.habit className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                {dict.nav.brand || siteConfig.name}
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((item, index) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      "min-h-11 rounded-lg px-3 py-3 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-muted font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right user nav & Quick Add */}
          <div className="flex items-center gap-3">
            <QuickAddHabitModal
              onSuccess={() => router.refresh()}
              trigger={
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:bg-primary/80"
                >
                  <Icons.add className="h-3.5 w-3.5" />
                  <span>{dict.nav.actions.addItem}</span>
                </button>
              }
            />
            <UserNavDisplay
              user={{
                name: user?.name,
                image: user?.image,
                email: user?.email,
              }}
              locale={explicitLocale}
            />
          </div>
        </nav>
      </header>
      <nav
        aria-label={dict.nav.mobileAria.mobileNavLabel}
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {mobileLinks.map((item) => {
            const Icon = Icons[item.icon || "next"]
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
