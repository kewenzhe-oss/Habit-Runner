"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const currentTheme = resolvedTheme || theme
    setTheme(currentTheme === "dark" ? "light" : "dark")
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg text-muted-foreground"
        aria-label="Toggle theme"
      >
        <Icons.sun className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = (resolvedTheme || theme) === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title={isDark ? "点击切换为明亮模式" : "点击切换为暗黑模式"}
      aria-label={isDark ? "点击切换为明亮模式" : "点击切换为暗黑模式"}
    >
      {isDark ? (
        <Icons.moon className="h-4 w-4 text-purple-400 transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Icons.sun className="h-4 w-4 text-amber-500 transition-transform duration-200 hover:rotate-45" />
      )}
    </Button>
  )
}
