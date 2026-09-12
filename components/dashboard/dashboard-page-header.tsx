"use client"

import * as React from "react"
import { useI18n } from "@/lib/i18n"

function getDynamicFlowGreeting(locale: string, hour: number) {
  if (locale === "zh") {
    if (hour >= 5 && hour < 11) {
      return "🌅 早安！今天的第一束火苗，从最小的微动作开始点燃。"
    } else if (hour >= 11 && hour < 14) {
      return "☀️ 正午时分：顺应精力起伏，稳步推进核心事项。"
    } else if (hour >= 14 && hour < 18) {
      return "⚡️ 心流进行中：充沛时攻坚破局，疲惫时随时降噪保底。"
    } else if (hour >= 18 && hour < 22) {
      return "🌇 日落关箱时分：盘点今日足迹，为明天种下一颗种子。"
    } else {
      return "🌙 静夜安歇：无论今天推进了多少，系统都已为你安全存档。"
    }
  }

  if (hour >= 5 && hour < 12) {
    return "🌅 Good morning! Ignite your day with a single micro-action."
  } else if (hour >= 12 && hour < 18) {
    return "⚡️ In flow: push deep when energized, drop down to micro when weary."
  } else if (hour >= 18 && hour < 22) {
    return "🌇 Evening reflection: honor today's footprint, plant seeds for tomorrow."
  } else {
    return "🌙 Rest and recharge: your system is safely preserved."
  }
}

export function DashboardPageHeader() {
  const { dict, locale } = useI18n()
  const [greeting, setGreeting] = React.useState<string>(dict.dashboard.header.subtitle)

  React.useEffect(() => {
    const currentHour = new Date().getHours()
    setGreeting(getDynamicFlowGreeting(locale, currentHour))
  }, [locale, dict.dashboard.header.subtitle])

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {dict.dashboard.header.title}
      </h1>
      <p className="text-xs text-muted-foreground sm:text-sm transition-opacity duration-300">
        {greeting}
      </p>
    </div>
  )
}
