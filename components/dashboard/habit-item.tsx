"use client"

import * as React from "react"
import Link from "next/link"
import { ItemRecentDayStatus, TodayItemDTO } from "@/types"

import {
  checkInPatch,
  isTodoCompleted,
  type MutateDashboardItem,
} from "@/lib/domain/dashboard"
import { addCalendarDays, formatDateInTimeZone } from "@/lib/domain/date"
import { triggerHaptic } from "@/lib/haptics"
import { formatLocalizedDate, formatLocalizedUnit, useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
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
  onMutate?: MutateDashboardItem
  isPending?: boolean
  dateStr?: string
  /** When true, list is in low/rest energy mode — P0 items get extra visual weight */
  isLowEnergyMode?: boolean
  /** When true, this habit has already been checked in today — dims the card */
  isDimmed?: boolean
}

const WEEKDAY_SHORT_ZH = ["一", "二", "三", "四", "五", "六", "日"]
const WEEKDAY_SHORT_EN = ["M", "T", "W", "T", "F", "S", "S"]

/** A readable weekly trace with shape and text alternatives for every state. */
function ThisWeekTraceBar({
  days,
  locale,
}: {
  days?: ItemRecentDayStatus[]
  locale: string
}) {
  if (!days?.length) return null
  const labels = locale === "zh" ? WEEKDAY_SHORT_ZH : WEEKDAY_SHORT_EN
  const states = days.map((day, index) => {
    const done = day.status === "COMPLETED" || day.status === "KEPT"
    const resting = day.status === "REST"
    const interrupted = day.status === "LAPSED" || day.status === "SKIPPED"
    const description = done
      ? locale === "zh"
        ? "已完成"
        : "Done"
      : resting
        ? locale === "zh"
          ? "休整"
          : "Rest"
        : interrupted
          ? locale === "zh"
            ? "已记录"
            : "Logged"
          : day.isFuture
            ? locale === "zh"
              ? "未到来"
              : "Upcoming"
            : day.isToday
              ? locale === "zh"
                ? "今日待记录"
                : "Today pending"
              : locale === "zh"
                ? "未记录"
                : "No record"
    return {
      day,
      label: labels[index],
      done,
      resting,
      interrupted,
      description,
    }
  })
  return (
    <div
      role="img"
      aria-label={`${locale === "zh" ? "本周记录" : "This week trace"}: ${states.map(({ day, label, description }) => `${day.date} (${label}) ${description}`).join("; ")}`}
      className="flex w-full min-w-0 shrink-0 justify-between gap-1 max-[375px]:gap-0.5 sm:w-auto sm:justify-start"
    >
      {states.map(({ day, label, done, resting, interrupted, description }) => (
        <span
          key={day.date}
          title={`${day.date}: ${description}`}
          aria-hidden="true"
          className={cn(
            "flex w-5 flex-col items-center gap-1 rounded-md py-1 text-xs text-muted-foreground",
            day.isToday && "bg-muted font-semibold text-foreground"
          )}
        >
          <span className="leading-none">{label}</span>
          {done ? (
            <Icons.check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
          ) : resting ? (
            <Icons.rest className="h-3.5 w-3.5" />
          ) : interrupted ? (
            <Icons.close className="h-3.5 w-3.5 text-orange-700 dark:text-orange-400" />
          ) : (
            <span className="flex h-3.5 w-3.5 items-center justify-center">
              <span
                className={cn(
                  "h-2 w-2 rounded-full border border-muted-foreground",
                  day.isFuture && "border-dashed"
                )}
              />
            </span>
          )}
        </span>
      ))}
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

export function HabitItem({
  item,
  onOpenRecord,
  onRefresh,
  onMutate,
  isPending = false,
  dateStr,
  isLowEnergyMode = false,
  isDimmed = false,
}: HabitItemProps) {
  const { dict, format, locale } = useI18n()
  const [isSaving, setIsLoading] = React.useState(false)
  const isLoading = isSaving || isPending
  const todoCompleted = isTodoCompleted(item)
  const mutate: MutateDashboardItem =
    onMutate ||
    (async (_item, _optimistic, save) => {
      await save()
      onRefresh()
    })
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
      const optimistic = {
        id: `pending-${item.id}`,
        status,
        actualEnergy: null,
      }
      await mutate(item, checkInPatch(item, dateStr, optimistic), async () => {
        const res = await fetch(`/api/items/${item.id}/quit-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, date: dateStr }),
        })
        if (!res.ok) throw new Error(dict.common.notifications.saveFailed)
        const { streaks, ...checkIn } = await res.json()
        return checkInPatch(item, dateStr, checkIn, streaks)
      })
      triggerHaptic("success")

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
    const nextStatus = todoCompleted ? "ACTIVE" : "COMPLETED"
    setIsLoading(true)
    try {
      const recurring =
        item.todoRecurrence === "WEEKLY" || item.todoRecurrence === "MONTHLY"
      const optimistic: Partial<TodayItemDTO> = {
        status:
          recurring && nextStatus === "COMPLETED"
            ? ("ACTIVE" as const)
            : nextStatus,
        todayCheckIn:
          nextStatus === "COMPLETED"
            ? {
                id: `pending-${item.id}`,
                status: "COMPLETED" as const,
                actualEnergy: "NORMAL" as const,
              }
            : null,
        updatedAt: new Date().toISOString(),
      }
      await mutate(item, optimistic, async () => {
        const res = await fetch(`/api/items/${item.id}/todo-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus, date: dateStr }),
        })
        if (!res.ok) throw new Error(dict.common.notifications.updateFailed)
        const updated = await res.json()
        return {
          status: updated.status,
          todayCheckIn: updated.todayCheckIn,
          updatedAt: updated.updatedAt,
        }
      })
      triggerHaptic(nextStatus === "COMPLETED" ? "success" : "light")

      toast({
        title:
          nextStatus === "COMPLETED"
            ? dict.dashboard.habitItem.todoCompletedToast
            : dict.dashboard.habitItem.todoReopenedToast,
      })
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
      const nextDateStr = addCalendarDays(
        item.dueDate || dateStr || formatDateInTimeZone(),
        daysToAdd
      )
      await mutate(item, { dueDate: nextDateStr }, async () => {
        const res = await fetch(`/api/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueDate: nextDateStr }),
        })
        if (!res.ok) throw new Error(dict.common.notifications.updateFailed)
        const updated = await res.json()
        return { dueDate: updated.dueDate, updatedAt: updated.updatedAt }
      })
      triggerHaptic("light")

      toast({
        title: format(dict.dashboard.habitItem.postponeToastTitle, {
          date: formatLocalizedDate(nextDateStr, locale),
        }),
        description: dict.dashboard.habitItem.postponeToastDesc,
      })
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
      await mutate(item, null, async () => {
        const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" })
        if (!res.ok) throw new Error(dict.common.notifications.deleteFailed)
        return null
      })
      triggerHaptic("medium")
      toast({ title: dict.common.notifications.deleteSuccess })
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

  const isP0 = item.priority === "HIGH"
  const highlightP0 = isLowEnergyMode && isP0
  const completedItem =
    todoCompleted ||
    checkInStatus === "COMPLETED" ||
    checkInStatus === "KEPT"

  const itemCopy = dict.dashboard.habitItem
  const goal =
    isLowEnergyMode && item.recommendedAction
      ? item.recommendedAction
      : item.targetAmount && item.unitLabel
        ? format(itemCopy.targetLabel, {
            amount: item.targetAmount,
            unit: formatLocalizedUnit(
              item.targetAmount,
              item.unitLabel,
              locale
            ),
          })
        : item.recommendedAction
  const checkedLabel =
    checkInStatus === "REST"
      ? itemCopy.restButton
      : checkInStatus === "COMPLETED" || checkInStatus === "KEPT"
        ? itemCopy.doneButton
        : itemCopy.loggedButton

  return (
    <article
      aria-busy={isLoading}
      data-completed={completedItem || undefined}
      className={cn(
        "relative space-y-2 border-b border-border py-4 transition-[background-color,color,opacity] duration-300 ease-out last:border-b-0",
        completedItem && "bg-muted/20 opacity-90",
        highlightP0 && "bg-amber-500/5",
        isDimmed && "bg-muted/10"
      )}
    >
      <div className="min-w-0 space-y-1.5 pr-10 sm:pr-12">
        <Link
          href={`/items/${item.id}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "line-clamp-2 break-words text-base font-semibold leading-6 text-foreground transition-[color,opacity] duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            completedItem &&
              "font-medium text-muted-foreground line-through decoration-muted-foreground/35"
          )}
        >
          {item.title}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.priority && item.priority !== "NORMAL" && (
            <span
              className={cn(
                "rounded-md px-2 py-1 font-medium",
                isP0
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isP0 ? itemCopy.priorityHigh : itemCopy.priorityLow}
            </span>
          )}
          {item.type !== "TODO" && streakCount > 0 && (
            <span>{format(itemCopy.streakLabel, { count: streakCount })}</span>
          )}
          {item.type === "TODO" && item.dueDate && (
            <span>
              {itemCopy.duePrefix}
              {formatLocalizedDate(item.dueDate, locale)}
            </span>
          )}
        </div>
        {item.type === "HABIT" && goal && (
          <p className="break-words text-sm leading-relaxed text-muted-foreground">
            {goal}
          </p>
        )}
        {item.tomorrowHint && !item.todayCheckIn && (
          <p className="break-words text-sm leading-relaxed text-emerald-800 dark:text-emerald-300">
            {locale === "zh" ? "今日方向：" : "Today: "}
            {item.tomorrowHint}
          </p>
        )}
        {item.todayCheckIn?.nextIntent && (
          <p className="break-words text-sm leading-relaxed text-muted-foreground">
            {locale === "zh" ? "明日预演：" : "Tomorrow: "}
            {item.todayCheckIn.nextIntent}
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 max-[375px]:grid max-[375px]:grid-cols-1 max-[375px]:gap-3">
        {item.type !== "TODO" && (
          <div className="min-w-0 max-[375px]:w-full">
            <ThisWeekTraceBar days={item.recent7Days} locale={locale} />
          </div>
        )}
        <div
          className={cn(
            "ml-auto flex min-w-0 items-center justify-end gap-2 max-[375px]:ml-0 max-[375px]:w-full max-[375px]:justify-stretch",
            item.type === "QUIT_HABIT" && !isCheckedIn && "w-full sm:w-auto"
          )}
        >
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
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icons.externalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          )}
          {item.type === "HABIT" && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light")
                onOpenRecord(item)
              }}
              aria-label={stateDotLabel}
              title={stateDotLabel}
              disabled={isLoading}
              className={cn(
                "inline-flex min-h-11 min-w-20 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 max-[375px]:flex-1",
                isCheckedIn
                  ? "border-input bg-background hover:bg-muted"
                  : "border-primary bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
              )}
            >
              {isLoading ? (
                <Icons.spinner
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin"
                />
              ) : isCheckedIn ? (
                <Icons.check aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Icons.add aria-hidden="true" className="h-4 w-4" />
              )}
              {isCheckedIn ? checkedLabel : itemCopy.recordButton}
            </button>
          )}
          {item.type === "QUIT_HABIT" &&
            (isCheckedIn ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light")
                  onOpenRecord(item)
                }}
                disabled={isLoading}
                title={
                  checkInStatus === "KEPT"
                    ? itemCopy.quitKeptDone
                    : itemCopy.quitLapsedDone
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 max-[375px]:flex-1"
              >
                <Icons.check aria-hidden="true" className="h-4 w-4" />
                {checkedLabel}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleQuitStatus("KEPT", e)}
                  disabled={isLoading}
                  className="min-h-11 flex-1 rounded-xl border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200"
                >
                  {itemCopy.quitKeptButton}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuitStatus("LAPSED", e)}
                  disabled={isLoading}
                  className="min-h-11 flex-1 rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  {itemCopy.quitLapsedButton}
                </button>
              </>
            ))}
          {item.type === "TODO" && (
            <button
              type="button"
              onClick={handleTodoToggle}
              disabled={isLoading}
              aria-label={format(
                todoCompleted
                  ? itemCopy.todoReopenAria
                  : itemCopy.todoCompleteAria,
                { title: item.title }
              )}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 max-[375px]:w-full"
            >
              {isLoading ? (
                <Icons.spinner
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin"
                />
              ) : todoCompleted ? (
                <Icons.refresh aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Icons.check aria-hidden="true" className="h-4 w-4" />
              )}
              {todoCompleted ? itemCopy.todoResetBtn : itemCopy.todoCompleteBtn}
            </button>
          )}
        </div>
      </div>
      <div className="absolute -right-2 top-2 !mt-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={format(dict.dashboard.habitItem.moreOptionsAria, {
              title: item.title,
            })}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-11 w-11 p-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <Icons.ellipsis className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="[&_[role=menuitem]]:min-h-11"
          >
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
