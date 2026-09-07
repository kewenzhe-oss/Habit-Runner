"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { EnergyLevel, TodayItemDTO } from "@/types"
import { useI18n } from "@/lib/i18n"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { getDailyQuote, getRandomQuote, type QuoteItem } from "@/lib/quotes"

interface TodayCompassCardProps {
  items: TodayItemDTO[]
  dailyEnergy?: EnergyLevel | null
  dateStr?: string
  initialEnergy?: EnergyLevel | null
  initialNote?: string | null
}

export function TodayCompassCard({
  items,
  dailyEnergy,
  dateStr,
  initialEnergy,
  initialNote,
}: TodayCompassCardProps) {
  const router = useRouter()
  const { dict, format } = useI18n()
  const compassDict = (dict.dashboard as any).compass || {}
  const [currentHour, setCurrentHour] = React.useState(12)

  // Inline energy state
  const [energy, setEnergy] = React.useState<EnergyLevel | null>(
    initialEnergy ?? dailyEnergy ?? null
  )
  const [isSavingEnergy, setIsSavingEnergy] = React.useState(false)

  React.useEffect(() => {
    setCurrentHour(new Date().getHours())
  }, [])

  // Daily Quote state
  const [quote, setQuote] = React.useState<QuoteItem>(() => getDailyQuote(dateStr))
  const [isFading, setIsFading] = React.useState(false)
  const [isRotating, setIsRotating] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)

  React.useEffect(() => {
    setQuote(getDailyQuote(dateStr))
  }, [dateStr])

  const handleShuffleQuote = () => {
    setIsRotating(true)
    setIsFading(true)
    setTimeout(() => {
      setQuote((prev) => getRandomQuote(prev?.quote))
      setIsFading(false)
      setTimeout(() => setIsRotating(false), 350)
    }, 150)
  }

  const handleCopyQuote = async () => {
    if (!quote) return
    try {
      await navigator.clipboard.writeText(`"${quote.quote}" — ${quote.author}`)
      setIsCopied(true)
      toast({
        title: compassDict.quoteCopied || "金句已复制到剪贴板",
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const saveEnergy = async (nextEnergy: EnergyLevel) => {
    const previous = energy
    setEnergy(nextEnergy)
    setIsSavingEnergy(true)
    try {
      const res = await fetch("/api/daily-energy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr ?? new Date().toISOString().split("T")[0],
          energyLevel: nextEnergy,
          note: initialNote || undefined,
        }),
      })
      if (!res.ok) throw new Error(dict.common.notifications.saveFailed)
      router.refresh()
    } catch {
      setEnergy(previous)
      toast({ title: dict.common.notifications.saveFailed, variant: "destructive" })
    } finally {
      setIsSavingEnergy(false)
    }
  }

  const isEvening = currentHour >= 20 || currentHour < 5

  // Separate Habits from TODOs
  const habitItems = items.filter(
    (i) => i.type === "HABIT" || i.type === "QUIT_HABIT"
  )
  const totalHabitsCount = habitItems.length

  const completedHabits = habitItems.filter(
    (i) =>
      i.todayCheckIn?.status === "COMPLETED" ||
      i.todayCheckIn?.status === "KEPT"
  )
  const restHabits = habitItems.filter(
    (i) => i.todayCheckIn?.status === "REST"
  )
  const checkedInHabitsCount = completedHabits.length + restHabits.length
  const pendingHabitsCount = totalHabitsCount - checkedInHabitsCount

  const pendingTodos = items.filter(
    (i) => i.type === "TODO" && i.status !== "COMPLETED"
  )
  const pendingTodosCount = pendingTodos.length

  // Calculate days remaining in the natural week (Mon=1 ... Sun=7)
  const todayDate = dateStr ? new Date(dateStr) : new Date()
  const rawDow = todayDate.getDay() // 0 is Sun, 1 is Mon...
  const isoDow = (rawDow + 6) % 7 + 1 // 1 is Mon ... 7 is Sun
  const daysLeftInWeek = Math.max(0, 7 - isoDow)

  // 1. Determine State: REST | COMPLETED | IN_PROGRESS | EMPTY
  let state: "REST" | "COMPLETED" | "IN_PROGRESS" | "EMPTY" = "IN_PROGRESS"

  if (totalHabitsCount === 0) {
    state = "EMPTY"
  } else if (
    dailyEnergy === "REST" ||
    (checkedInHabitsCount > 0 &&
      restHabits.length === checkedInHabitsCount &&
      pendingHabitsCount === 0)
  ) {
    state = "REST"
  } else if (pendingHabitsCount === 0) {
    state = "COMPLETED"
  } else {
    state = "IN_PROGRESS"
  }

  return (
    <Card className="relative overflow-hidden border-border/80 bg-linear-to-br from-card to-muted/20 p-4 shadow-xs md:p-5">
      {/* Background subtle accent pulse */}
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl",
          state === "COMPLETED"
            ? "bg-blue-500/10"
            : state === "REST"
              ? "bg-purple-500/10"
              : "bg-emerald-500/10"
        )}
      />

      <div className="relative space-y-3">
        {/* Top Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* State Badge */}
          {state === "IN_PROGRESS" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {format(
                  compassDict.badgeInProgress || "今日进行中 · 已完成 {checked}/{total}",
                  { checked: checkedInHabitsCount, total: totalHabitsCount }
                )}
              </span>
            </span>
          )}

          {state === "COMPLETED" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <Icons.check className="h-3 w-3" />
              <span>
                {format(
                  compassDict.badgeCompleted || "✓ 今日日常已达成 · {total}/{total}",
                  { total: totalHabitsCount }
                )}
              </span>
            </span>
          )}

          {state === "REST" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
              <span>☕</span>
              <span>{compassDict.badgeRest || "今日主动休整"}</span>
            </span>
          )}

          {state === "EMPTY" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <span>🌱</span>
              <span>{compassDict.badgeEmpty || "起步中"}</span>
            </span>
          )}

          {/* Time Context (Fuzzy) */}
          <span className="text-[11px] text-muted-foreground/75">
            {daysLeftInWeek > 0
              ? format(compassDict.daysLeft || "本周还剩 {count} 天", {
                  count: daysLeftInWeek,
                })
              : compassDict.lastDay || "本周最后一天"}
          </span>
        </div>

        {/* Daily Wisdom Mode (方案 1：优雅金句沉浸态) */}
        <div className="relative pt-0.5 pb-0.5">
          {/* Accessible screen-reader heading for status announcement and test compatibility */}
          <h2 className="sr-only">
            {state === "IN_PROGRESS" &&
              format(
                compassDict.titleInProgress || "今日还剩 {count} 项日常",
                {
                  count: pendingHabitsCount,
                  s: pendingHabitsCount > 1 ? "s" : "",
                }
              )}
            {state === "COMPLETED" &&
              (compassDict.titleCompleted || "今天的日常已全部完成")}
            {state === "REST" &&
              (compassDict.titleRest || "今天处于主动休整状态")}
            {state === "EMPTY" &&
              (compassDict.titleEmpty || "开启你的第一个日常行动")}
          </h2>

          <div
            className={cn(
              "group relative transition-all duration-300",
              isFading ? "opacity-0 translate-y-0.5" : "opacity-100 translate-y-0"
            )}
          >
            <blockquote className="text-sm font-medium leading-relaxed tracking-tight text-foreground/95 sm:text-base md:text-[17px]">
              <span className="mr-1 select-none font-serif text-base text-muted-foreground/50 sm:text-lg">“</span>
              <span>{quote.quote}</span>
              <span className="ml-1 select-none font-serif text-base text-muted-foreground/50 sm:text-lg">”</span>
            </blockquote>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs font-normal tracking-wide text-muted-foreground/80">
                —— {quote.author}
              </span>

              <div className="flex items-center gap-1.5 opacity-70 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-60">
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  title={compassDict.copyQuote || "复制金句"}
                  aria-label={compassDict.copyQuote || "复制金句"}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {isCopied ? (
                    <Icons.check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Icons.copy className="h-3 w-3" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShuffleQuote}
                  title={compassDict.shuffleQuote || "换一句"}
                  aria-label={compassDict.shuffleQuote || "换一句"}
                  className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted hover:text-foreground transition-all active:scale-95"
                >
                  <Icons.refresh
                    className={cn(
                      "h-3 w-3 transition-transform duration-500",
                      isRotating && "rotate-180"
                    )}
                  />
                  <span>{compassDict.shuffleQuote || "换一句"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary TODO Notification (Weak Auxiliary Mention) */}
        {pendingTodosCount > 0 && (
          <div className="flex items-center gap-2 border-t border-border/50 pt-2.5 text-xs text-muted-foreground/90">
            <span className="flex h-4 w-4 items-center justify-center rounded-xs bg-muted/60 text-[10px]">
              📋
            </span>
            <span>
              {format(
                compassDict.secondaryTodo || "📋 另有 {count} 个待办任务待处理",
                {
                  count: pendingTodosCount,
                  s: pendingTodosCount > 1 ? "s" : "",
                }
              )}
            </span>
          </div>
        )}

        {/* Inline Energy Selector — quiet pill row */}
        <div className="flex items-center gap-1.5 border-t border-border/40 pt-3">
          <span className="mr-1 text-[11px] text-muted-foreground/60">
            {dict.dashboard.energySelector.title}
          </span>
          {(["HIGH", "NORMAL", "LOW", "REST"] as EnergyLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={energy === level}
              disabled={isSavingEnergy}
              onClick={() => saveEnergy(level)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-50",
                energy === level
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/60 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
              )}
            >
              {dict.common.energy[level.toLowerCase() as "high" | "normal" | "low" | "rest"]}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
