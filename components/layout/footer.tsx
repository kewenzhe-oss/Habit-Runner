"use client"

import Link from "next/link"

import { siteConfig } from "@/config/site"
import { getDictionary, Locale, useI18n } from "@/lib/i18n"

import { ModeToggle } from "../mode-toggle"

interface FooterProps {
  locale?: Locale
  variant?: "app" | "public"
}

export default function Footer({
  locale: explicitLocale,
  variant = "app",
}: FooterProps) {
  const i18n = useI18n()
  const dict = explicitLocale ? getDictionary(explicitLocale) : i18n.dict

  const navLinks =
    variant === "public"
      ? [
          { title: "Home", href: "/", external: false },
          { title: "About", href: "/about", external: false },
          { title: "Search", href: "/search", external: false },
          { title: "Source", href: siteConfig.links.github, external: true },
        ]
      : [
          {
            title: dict.nav.links.dashboard,
            href: "/dashboard",
            external: false,
          },
          {
            title: dict.nav.links.insights,
            href: "/insights",
            external: false,
          },
          {
            title: dict.nav.links.settings,
            href: "/settings",
            external: false,
          },
          { title: "About", href: "/about", external: false },
        ]

  const machineLinks = [
    { title: "llms.txt", href: "/llms.txt" },
    { title: "Full AI context", href: "/llms-full.txt" },
    { title: "Citation guide", href: "/about#citation" },
  ]

  return (
    <footer className="mt-auto border-t bg-muted/20">
      <div className="mx-auto w-full max-w-screen-xl p-6 pb-24 md:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">
              {dict.nav.brand || siteConfig.name}
            </h2>
            <p className="max-w-sm text-xs text-muted-foreground">
              {dict.landing.footer.slogan}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:items-end">
            <div className="flex items-center gap-4">
              <ul
                aria-label="Footer navigation"
                className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
              >
                {navLinks.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                      className="inline-flex min-h-11 items-center rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <ModeToggle />
            </div>
            <ul
              aria-label="Machine-readable resources"
              className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/80"
            >
              {machineLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-6 border-border" />

        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              © {new Date().getFullYear()} {siteConfig.name}.{" "}
              {dict.landing.footer.allRightsReserved}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground/70">
              by{" "}
              <span className="font-medium text-foreground/80">
                postsoma-2050
              </span>
            </span>
          </div>
          <span>{dict.landing.footer.philosophy}</span>
        </div>
      </div>
    </footer>
  )
}
