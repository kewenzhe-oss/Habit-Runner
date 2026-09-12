"use client"

import * as React from "react"
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
    <footer className="mt-auto border-t bg-muted/15">
      <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 md:px-8">
        {/* Main Row: Brand & Slogan on Left, Nav & One-click Theme Toggle on Right */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-foreground">
              {dict.nav.brand || siteConfig.name}
            </span>
            <span className="text-muted-foreground/30 hidden sm:inline">·</span>
            <span className="text-muted-foreground">
              {dict.landing.footer.slogan}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-3">
              {navLinks.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  className="transition-colors hover:text-foreground"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
            <div className="h-3 w-px bg-border/80 shrink-0" />
            <ModeToggle />
          </div>
        </div>

        {/* Compact Sub-row: Copyright, AI Context links, and Philosophy */}
        <div className="mt-3 flex flex-col items-start justify-between gap-2 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground/80 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              © {new Date().getFullYear()} {siteConfig.name}.{" "}
              {dict.landing.footer.allRightsReserved}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span>by postsoma-2050</span>
            <span className="text-muted-foreground/30">·</span>
            {machineLinks.map((item, idx) => (
              <React.Fragment key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground/60 transition-colors hover:text-foreground hover:underline"
                >
                  {item.title}
                </Link>
                {idx < machineLinks.length - 1 && (
                  <span className="text-muted-foreground/30">·</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <span className="text-muted-foreground/70">
            {dict.landing.footer.philosophy}
          </span>
        </div>
      </div>
    </footer>
  )
}
