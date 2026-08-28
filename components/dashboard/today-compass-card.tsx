"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { EnergyLevel, TodayItemDTO } from "@/types"
import { useI18n } from "@/lib/i18n"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

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

        {/* Main Title & Narrative */}
        <div className="space-y-1">
          {state === "IN_PROGRESS" && (
            <>
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                {format(
                  compassDict.titleInProgress || "今日还剩 {count} 项日常",
                  {
                    count: pendingHabitsCount,
                    s: pendingHabitsCount > 1 ? "s" : "",
                  }
                )}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {isEvening
                  ? compassDict.nightDesc ||
                    "今晚时间不多了，做个微行动或者早点休息吧。"
                  : compassDict.dayDesc ||
                    "今天时间还很充裕，按你的节奏来。"}
              </p>
            </>
          )}

          {state === "COMPLETED" && (
            <>
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                {compassDict.titleCompleted || "今天的日常已全部完成"}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {compassDict.completedDesc ||
                  "今天的节律已稳稳达成，享受放松时间。"}
              </p>
            </>
          )}

          {state === "REST" && (
            <>
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                {compassDict.titleRest || "今天处于主动休整状态"}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {compassDict.restDesc ||
                  "好好放松、蓄积精力，也是生活的一部分。"}
              </p>
            </>
          )}

          {state === "EMPTY" && (
            <>
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                {compassDict.titleEmpty || "开启你的第一个日常行动"}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {compassDict.emptyDesc ||
                  "添加你想维持的行动，生活节律将从每一次记录中自然生长。"}
              </p>
            </>
          )}
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
