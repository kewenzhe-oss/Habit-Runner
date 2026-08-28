"use client"

import * as React from "react"
import Link from "next/link"
import { ItemRecentDayStatus, TodayItemDTO } from "@/types"

import { cn } from "@/lib/utils"
import { useI18n, formatLocalizedDate } from "@/lib/i18n"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

interface HabitItemProps {
  item: TodayItemDTO
  onOpenRecord: (item: TodayItemDTO) => void
  onRefresh: () => void
}

const WEEKDAY_SHORT_ZH = ["一", "二", "三", "四", "五", "六", "日"]
const WEEKDAY_SHORT_EN = ["M", "T", "W", "T", "F", "S", "S"]

/**
 * Simplified 7-day trace bar.
 * No "本周" label wrapper — the dots themselves convey the week.
 */
function ThisWeekTraceBar({
  days,
  locale,
}: {
  days?: ItemRecentDayStatus[]
  locale: string
}) {
  if (!days || days.length === 0) return null
  const labels = locale === "zh" ? WEEKDAY_SHORT_ZH : WEEKDAY_SHORT_EN

  return (
    <div className="flex items-center gap-1.5" aria-label="This week trace">
      {days.map((day, idx) => {
        const isToday = Boolean(day.isToday)
        const isFuture = Boolean(day.isFuture)
        const label = labels[idx] || ""

        let dotClass = "bg-muted-foreground/20"
        let statusTitle = `${day.date} (${label})`

        if (day.status === "COMPLETED" || day.status === "KEPT") {
          dotClass =
            day.actualEnergy === "HIGH"
              ? "bg-emerald-500"
              : day.actualEnergy === "LOW"
                ? "bg-amber-400"
                : "bg-emerald-500"
          statusTitle += `: ${locale === "zh" ? "已完成" : "Done"}`
        } else if (day.status === "REST") {
          dotClass = "bg-muted-foreground/35"
          statusTitle += `: ${locale === "zh" ? "休整" : "Rest"}`
        } else if (day.status === "LAPSED") {
          dotClass = "bg-orange-400/60"
          statusTitle += `: ${locale === "zh" ? "中断" : "Lapsed"}`
        } else if (isToday) {
          dotClass =
            "border border-dashed border-primary/70 bg-primary/10 animate-pulse"
          statusTitle += `: ${locale === "zh" ? "今日待打卡" : "Today pending"}`
        } else if (isFuture) {
          dotClass = "border border-dashed border-muted-foreground/20"
          statusTitle += `: ${locale === "zh" ? "未到来" : "Upcoming"}`
        }

        return (
          <div
            key={day.date}
            title={statusTitle}
            className="flex flex-col items-center gap-0.5"
          >
            <span
              className={cn(
                "text-[8px] leading-none",
                isToday
                  ? "font-bold text-primary"
                  : isFuture
                    ? "text-muted-foreground/30"
                    : "text-muted-foreground/50"
              )}
            >
              {label}
            </span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all",
                dotClass,
                isToday && "h-2 w-2"
              )}
            />
          </div>
        )
      })}
    </div>
  )
}

function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`)
    return parsed.hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || url
  }
}

export function HabitItem({ item, onOpenRecord, onRefresh }: HabitItemProps) {
  const { dict, format, locale } = useI18n()
  const [isLoading, setIsLoading] = React.useState(false)
  const isCheckedIn = !!item.todayCheckIn
  const checkInStatus = item.todayCheckIn?.status
  const actualEnergy = item.todayCheckIn?.actualEnergy

  const primaryToolLink =
    item.recommendedTool ||
    (item.toolLinks && item.toolLinks.length > 0 ? item.toolLinks[0] : null)

  const toolDomain = primaryToolLink?.url
    ? getDomainFromUrl(primaryToolLink.url)
    : ""
  const toolTooltip = primaryToolLink
    ? primaryToolLink.title && primaryToolLink.title !== toolDomain
      ? `${primaryToolLink.title} (${toolDomain})`
      : toolDomain
    : ""
  const toolAriaLabel = primaryToolLink
    ? format(dict.dashboard.habitItem.openExternalLinkAria, {
        domain: toolDomain,
      })
    : ""

  const streakCount =
    item.type === "QUIT_HABIT"
      ? item.maintainedDays ?? item.actionStreak ?? 0
      : item.rhythmStreak ?? item.actionStreak ?? 0

  // Quit habit status
  const handleQuitStatus = async (
    status: "KEPT" | "LAPSED",
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    setIsLoading(true)
    try {
      const res = await fetch(`/api/items/${item.id}/quit-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error(dict.common.notifications.saveFailed)

      toast({
        title:
          status === "KEPT"
            ? dict.dashboard.habitItem.quitKeptToastTitle
            : dict.dashboard.habitItem.quitLapsedToastTitle,
        description:
          status === "KEPT"
            ? format(dict.dashboard.habitItem.quitKeptToastDesc, {
                streak: item.actionStreak + 1,
              })
            : dict.dashboard.habitItem.quitLapsedToastDesc,
      })
      onRefresh()
    } catch (err: any) {
      toast({
        title: dict.common.notifications.saveFailed,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Todo status toggle
  const handleTodoToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextStatus = item.status === "COMPLETED" ? "ACTIVE" : "COMPLETED"
    setIsLoading(true)
    try {
      const res = await fetch(`/api/items/${item.id}/todo-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!res.ok) throw new Error(dict.common.notifications.updateFailed)

      toast({
        title:
          nextStatus === "COMPLETED"
            ? dict.dashboard.habitItem.todoCompletedToast
            : dict.dashboard.habitItem.todoReopenedToast,
      })
      onRefresh()
    } catch (err: any) {
      toast({
        title: dict.common.notifications.updateFailed,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Todo Postpone (延期)
  const handlePostponeTodo = async (daysToAdd: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading(true)
    try {
      const currentDue = item.dueDate ? new Date(item.dueDate) : new Date()
      currentDue.setDate(currentDue.getDate() + daysToAdd)
      const nextDateStr = currentDue.toISOString().split("T")[0]

      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: nextDateStr }),
      })

      if (!res.ok) throw new Error(dict.common.notifications.updateFailed)

      toast({
        title: format(dict.dashboard.habitItem.postponeToastTitle, {
          date: formatLocalizedDate(nextDateStr, locale),
        }),
        description: dict.dashboard.habitItem.postponeToastDesc,
      })
      onRefresh()
    } catch (err: any) {
      toast({
        title: dict.common.notifications.updateFailed,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Delete item
  const handleDelete = async () => {
    if (
      !confirm(
        format(dict.dashboard.habitItem.deleteConfirm, {
          title: item.title,
        })
      )
    )
      return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(dict.common.notifications.deleteFailed)
      toast({ title: dict.common.notifications.deleteSuccess })
      onRefresh()
    } catch (err: any) {
      toast({
        title: dict.common.notifications.deleteFailed,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Tooltip text for state dot
  const stateDotLabel = isCheckedIn
    ? checkInStatus === "REST"
      ? locale === "zh"
        ? "主动休整 — 点击调整"
        : "Rest day — tap to adjust"
      : actualEnergy === "LOW"
        ? locale === "zh"
          ? "轻行动完成 — 点击调整"
          : "Light action done — tap to adjust"
        : actualEnergy === "HIGH"
          ? locale === "zh"
            ? "充沛完成 — 点击调整"
            : "High energy done — tap to adjust"
          : locale === "zh"
            ? "已完成 — 点击调整"
            : "Done — tap to adjust"
    : locale === "zh"
      ? "点击记录今日行动"
      : "Tap to record today"

  return (
    <article
      className={cn(
        "group flex items-center gap-3 border-b border-border/40 px-0 py-3 last:border-b-0 transition-colors hover:bg-muted/20",
        item.status === "COMPLETED" && "opacity-50"
      )}
    >
      {/* 2px color bar — type/color indicator */}
      {item.type !== "TODO" && (
        <span
          className="h-6 w-0.5 shrink-0 rounded-full opacity-60 group-hover:opacity-90 transition-opacity"
          style={{ backgroundColor: item.colorCode || "#10B981" }}
        />
      )}

      {/* Left content: title + trace */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Title */}
          <Link
            href={`/items/${item.id}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "truncate text-sm font-medium text-foreground transition-colors hover:text-primary",
              item.status === "COMPLETED" &&
                "text-muted-foreground line-through decoration-muted-foreground/40"
            )}
          >
            {item.title}
          </Link>

          {/* External Tool Link Shortcut */}
          {primaryToolLink?.url && (
            <a
              href={primaryToolLink.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={
                toolAriaLabel ||
                (locale === "zh"
                  ? `打开关联工具：${toolDomain}`
                  : `Open linked tool: ${toolDomain}`)
              }
              title={toolTooltip}
              className="group/link inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Icons.externalLink className="h-3.5 w-3.5 transition-transform group-hover/link:scale-110" />
            </a>
          )}

          {/* Streak count — unstyled, appears on hover */}
          {item.type !== "TODO" && streakCount > 0 && (
            <span className="text-[11px] text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60">
              {streakCount}
              {locale === "zh" ? "天" : "d"}
            </span>
          )}
        </div>

        {/* 7-day trace — second row, no label */}
        {item.type !== "TODO" && (
          <ThisWeekTraceBar days={item.recent7Days} locale={locale} />
        )}

        {/* TODO due date */}
        {item.type === "TODO" && item.dueDate && (
          <p className="text-[11px] text-muted-foreground/70">
            {dict.dashboard.habitItem.duePrefix}
            {item.dueDate}
          </p>
        )}
      </div>

      {/* Right: state control + options menu */}
      <div className="flex shrink-0 items-center gap-0">
        {/* ——— HABIT: state dot ——— */}
        {item.type === "HABIT" && (
          <button
            type="button"
            onClick={() => onOpenRecord(item)}
            aria-label={stateDotLabel}
            title={stateDotLabel}
            disabled={isLoading}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted/50 disabled:opacity-50"
          >
            <span
              className={cn(
                "h-4 w-4 rounded-full border-2 transition-all",
                isCheckedIn
                  ? "border-transparent scale-100"
                  : "border-muted-foreground/25 bg-transparent hover:border-muted-foreground/50 scale-90"
              )}
              style={
                isCheckedIn && checkInStatus !== "REST"
                  ? { backgroundColor: item.colorCode || "#10B981" }
                  : isCheckedIn && checkInStatus === "REST"
                    ? { backgroundColor: "hsl(var(--muted-foreground) / 0.35)" }
                    : {}
              }
            />
          </button>
        )}

        {/* ——— QUIT_HABIT: dot when checked, inline text buttons when not ——— */}
        {item.type === "QUIT_HABIT" && (
          <>
            {isCheckedIn ? (
              <button
                type="button"
                onClick={() => onOpenRecord(item)}
                title={
                  checkInStatus === "KEPT"
                    ? dict.dashboard.habitItem.quitKeptDone
                    : dict.dashboard.habitItem.quitLapsedDone
                }
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "h-4 w-4 rounded-full transition-all",
                    checkInStatus === "KEPT"
                      ? "bg-emerald-500"
                      : "bg-orange-400/80"
                  )}
                />
              </button>
            ) : (
              <div className="flex items-center gap-1 pr-1">
                <button
                  type="button"
                  onClick={(e) => handleQuitStatus("KEPT", e)}
                  disabled={isLoading}
                  className="rounded px-2 py-1 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 disabled:opacity-50"
                >
                  {dict.dashboard.habitItem.quitKeptButton}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuitStatus("LAPSED", e)}
                  disabled={isLoading}
                  className="rounded px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {dict.dashboard.habitItem.quitLapsedButton}
                </button>
              </div>
            )}
          </>
        )}

        {/* ——— TODO: square checkbox dot ——— */}
        {item.type === "TODO" && (
          <button
            type="button"
            onClick={handleTodoToggle}
            disabled={isLoading}
            aria-label={
              item.status === "COMPLETED"
                ? format(dict.dashboard.habitItem.todoReopenAria, {
                    title: item.title,
                  })
                : format(dict.dashboard.habitItem.todoCompleteAria, {
                    title: item.title,
                  })
            }
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted/50 disabled:opacity-50"
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border-2 transition-all",
                item.status === "COMPLETED"
                  ? "border-transparent bg-primary"
                  : "border-muted-foreground/25 bg-transparent hover:border-muted-foreground/50"
              )}
            >
              {item.status === "COMPLETED" && (
                <Icons.check className="h-2.5 w-2.5 text-primary-foreground" />
              )}
            </span>
          </button>
        )}

        {/* ——— Options menu — hidden until hover ——— */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={format(dict.dashboard.habitItem.moreOptionsAria, {
              title: item.title,
            })}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 w-9 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
            )}
          >
            <Icons.ellipsis className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/items/${item.id}`} className="cursor-pointer">
                {dict.dashboard.habitItem.viewDetails}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/items/${item.id}/edit`} className="cursor-pointer">
                {dict.dashboard.habitItem.editSettings}
              </Link>
            </DropdownMenuItem>

            {/* Tool links moved into menu */}
            {item.toolLinks.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {item.toolLinks.map((link, i) => (
                  <DropdownMenuItem key={i} asChild>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer"
                    >
                      <span>{link.title}</span>
                      <Icons.externalLink className="ml-auto h-3 w-3 opacity-60" />
                    </a>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Postpone options for TODOs */}
            {item.type === "TODO" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => handlePostponeTodo(1, e as any)}
                >
                  {dict.dashboard.habitItem.postpone1Day}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => handlePostponeTodo(3, e as any)}
                >
                  {dict.dashboard.habitItem.postpone3Days}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => handlePostponeTodo(7, e as any)}
                >
                  {dict.dashboard.habitItem.postpone7Days}
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              {dict.common.actions.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}
