"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { useI18n } from "@/lib/i18n"
import { triggerHaptic } from "@/lib/haptics"
import { Icons } from "@/components/icons"

export function AppearanceForm() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { dict, format } = useI18n()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const selected = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : undefined
  const next = selected === "dark" ? "light" : "dark"
  const label = format(dict.item.settingsPage.switchTheme, {
    theme: dict.common.theme[next],
  })
  const Icon = selected === "dark" ? Icons.moon : Icons.sun

  return (
    <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-2">
      <span className="text-sm font-medium">
        {dict.item.settingsPage.appearanceTitle}
      </span>
      <button
        type="button"
        disabled={!mounted}
        title={label}
        aria-label={label}
        onClick={() => {
          triggerHaptic("light")
          setTheme(next)
        }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-input bg-background transition-[background-color,transform] duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:rotate-6 active:scale-95 disabled:opacity-60 motion-reduce:transform-none"
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
        <span className="sr-only">
          {selected
            ? dict.common.theme[selected === "dark" ? "dark" : "light"]
            : dict.common.status.loading}
        </span>
      </button>
    </div>
  )
}
