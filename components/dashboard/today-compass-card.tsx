"use client"

import * as React from "react"
import { EnergyLevel, TodayItemDTO } from "@/types"

import { isTodoCompleted } from "@/lib/domain/dashboard"
import { calendarDayOfWeek, formatDateInTimeZone } from "@/lib/domain/date"
import { triggerHaptic } from "@/lib/haptics"
import { useI18n } from "@/lib/i18n"
import { getDailyQuote, getRandomQuote, type QuoteItem } from "@/lib/quotes"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

interface TodayCompassCardProps {
  items: TodayItemDTO[]
  dailyEnergy?: EnergyLevel | null
  dateStr?: string
  initialEnergy?: EnergyLevel | null
  initialNote?: string | null
  onEnergyChange?: (energy: EnergyLevel | null) => void
}

export function TodayCompassCard({
  items,
  dailyEnergy,
  dateStr,
  initialEnergy,
  initialNote,
  onEnergyChange,
}: TodayCompassCardProps) {
  const { dict, format } = useI18n()
  const compassDict = (dict.dashboard as any).compass || {}

  // Inline energy state
  const [energy, setEnergy] = React.useState<EnergyLevel | null>(
    initialEnergy ?? dailyEnergy ?? null
  )
  const [isSavingEnergy, setIsSavingEnergy] = React.useState(false)

  React.useEffect(() => {
    setEnergy(initialEnergy ?? dailyEnergy ?? null)
  }, [initialEnergy, dailyEnergy])

  // Daily Quote state
  const [quote, setQuote] = React.useState<QuoteItem>(() =>
    getDailyQuote(dateStr)
  )
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
    if (isSavingEnergy || nextEnergy === energy) return
    triggerHaptic("light")
    const previous = energy
    setEnergy(nextEnergy)
    onEnergyChange?.(nextEnergy)
    setIsSavingEnergy(true)
    try {
      const res = await fetch("/api/daily-energy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr ?? formatDateInTimeZone(),
          energyLevel: nextEnergy,
          note: initialNote || undefined,
        }),
      })
      if (!res.ok) throw new Error(dict.common.notifications.saveFailed)
    } catch {
      setEnergy(previous)
      onEnergyChange?.(previous)
      toast({
        title: dict.common.notifications.saveFailed,
        variant: "destructive",
      })
    } finally {
      setIsSavingEnergy(false)
    }
  }

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
  const restHabits = habitItems.filter((i) => i.todayCheckIn?.status === "REST")
  const checkedInHabitsCount = completedHabits.length + restHabits.length
  const pendingHabitsCount = totalHabitsCount - checkedInHabitsCount

  const pendingTodos = items.filter(
    (i) => i.type === "TODO" && !isTodoCompleted(i)
  )
  const pendingTodosCount = pendingTodos.length

  // Calculate days remaining in the natural week (Mon=1 ... Sun=7)
  const rawDow = calendarDayOfWeek(dateStr || formatDateInTimeZone()) // 0 is Sun, 1 is Mon...
  const isoDow = ((rawDow + 6) % 7) + 1 // 1 is Mon ... 7 is Sun
  const daysLeftInWeek = Math.max(0, 7 - isoDow)

  // 1. Determine State: REST | COMPLETED | IN_PROGRESS | EMPTY
  let state: "REST" | "COMPLETED" | "IN_PROGRESS" | "EMPTY" = "IN_PROGRESS"

  if (totalHabitsCount === 0) {
    state = "EMPTY"
  } else if (
    energy === "REST" ||
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

  const stateLabel =
    state === "IN_PROGRESS"
      ? format(compassDict.badgeInProgress, {
          checked: checkedInHabitsCount,
          total: totalHabitsCount,
        })
      : state === "COMPLETED"
        ? format(compassDict.badgeCompleted, { total: totalHabitsCount })
        : state === "REST"
          ? compassDict.badgeRest
          : compassDict.badgeEmpty

  return (
    <Card
      data-completion-state={state.toLowerCase()}
      className={cn(
        "relative overflow-hidden rounded-2xl border-border bg-gradient-to-br from-card to-muted/20 p-4 sm:p-5",
        state === "COMPLETED" && "border-emerald-500/25"
      )}
    >
      {state === "COMPLETED" && (
        <>
          <span
            aria-hidden="true"
            className="motion-safe:animate-compass-glow pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-gradient-to-br from-emerald-300/30 via-amber-200/20 to-transparent blur-2xl"
          />
          <span
            aria-hidden="true"
            className="motion-safe:animate-compass-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </>
      )}
      <div className="relative space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-medium",
              state === "COMPLETED"
                ? "text-blue-700 dark:text-blue-300"
                : state === "REST"
                  ? "text-purple-700 dark:text-purple-300"
                  : "text-emerald-700 dark:text-emerald-300"
            )}
          >
            {state === "COMPLETED" ? (
              <span className="motion-safe:animate-compass-badge inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <Icons.check aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
            ) : state === "REST" ? (
              <Icons.rest aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Icons.circle aria-hidden="true" className="h-3 w-3" />
            )}
            {stateLabel}
          </span>
          <span className="text-muted-foreground">
            {daysLeftInWeek > 0
              ? format(compassDict.daysLeft, { count: daysLeftInWeek })
              : compassDict.lastDay}
          </span>
        </div>

        <h2 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
          {state === "IN_PROGRESS" &&
            format(compassDict.titleInProgress, {
              count: pendingHabitsCount,
              s: pendingHabitsCount > 1 ? "s" : "",
            })}
          {state === "COMPLETED" && compassDict.titleCompleted}
          {state === "REST" && compassDict.titleRest}
          {state === "EMPTY" && compassDict.titleEmpty}
        </h2>

        {totalHabitsCount > 0 && (
          <div
            role="progressbar"
            aria-label={compassDict.progressLabel}
            aria-valuemin={0}
            aria-valuemax={totalHabitsCount}
            aria-valuenow={checkedInHabitsCount}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-200 motion-reduce:transition-none dark:bg-emerald-400"
              style={{
                width: `${(checkedInHabitsCount / totalHabitsCount) * 100}%`,
              }}
            />
          </div>
        )}
        {pendingTodosCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {format(compassDict.secondaryTodo, {
              count: pendingTodosCount,
              s: pendingTodosCount > 1 ? "s" : "",
            })}
          </p>
        )}

        <div className="space-y-2 pt-1">
          <div className="flex min-h-5 items-center justify-between gap-2">
            <span id="today-energy-label" className="text-sm font-medium">
              {dict.dashboard.energySelector.title}
            </span>
            {isSavingEnergy && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Icons.spinner
                  aria-hidden="true"
                  className="h-3.5 w-3.5 animate-spin"
                />
                {dict.dashboard.energySelector.saving}
              </span>
            )}
          </div>
          <div
            role="group"
            aria-labelledby="today-energy-label"
            className="grid grid-cols-4 gap-2"
          >
            {(["HIGH", "NORMAL", "LOW", "REST"] as EnergyLevel[]).map(
              (level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={energy === level}
                  disabled={isSavingEnergy}
                  onClick={() => saveEnergy(level)}
                  className={cn(
                    "min-h-11 rounded-xl border px-1.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
                    energy === level
                      ? "border-foreground bg-foreground text-background"
                      : "border-input bg-background text-foreground hover:bg-muted active:bg-muted"
                  )}
                >
                  {
                    dict.common.energy[
                      level.toLowerCase() as "high" | "normal" | "low" | "rest"
                    ]
                  }
                </button>
              )
            )}
          </div>
        </div>

        <section
          aria-labelledby="today-wisdom-title"
          className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 sm:px-4"
        >
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icons.quotes aria-hidden="true" className="h-4 w-4" />
            <h3 id="today-wisdom-title">{compassDict.dailyWisdom}</h3>
          </div>
          <div
            className={cn(
              "transition-[opacity,transform] duration-300 ease-out motion-reduce:transform-none",
              isFading
                ? "-translate-y-0.5 opacity-0"
                : "translate-y-0 opacity-100"
            )}
          >
            <blockquote className="text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
              “{quote.quote}”
            </blockquote>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                — {quote.author}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  title={compassDict.copyQuote}
                  aria-label={compassDict.copyQuote}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background/70 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isCopied ? (
                    <Icons.check
                      aria-hidden="true"
                      className="h-4 w-4 text-emerald-600"
                    />
                  ) : (
                    <Icons.copy aria-hidden="true" className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleShuffleQuote}
                  title={compassDict.shuffleQuote}
                  aria-label={compassDict.shuffleQuote}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icons.refresh
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 transition-transform motion-reduce:transition-none",
                      isRotating && "rotate-180"
                    )}
                  />
                  {compassDict.shuffleQuote}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Card>
  )
}
