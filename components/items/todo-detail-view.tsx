"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ItemDetailDTO } from "@/types"
import { cn } from "@/lib/utils"
import { useI18n, formatLocalizedDate } from "@/lib/i18n"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/pages/dashboard/dashboard-header"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

interface TodoDetailViewProps {
  item: ItemDetailDTO
}

export function TodoDetailView({ item }: TodoDetailViewProps) {
  const { dict, locale, format } = useI18n()
  const router = useRouter()
  const [isCompleted, setIsCompleted] = React.useState(
    item.status === "COMPLETED"
  )
  const [isLoading, setIsLoading] = React.useState(false)

  const isOverdue =
    !isCompleted &&
    item.dueDate &&
    item.dueDate < new Date().toISOString().split("T")[0]

  const handleToggleStatus = async () => {
    setIsLoading(true)
    try {
      const nextStatus = isCompleted ? "ACTIVE" : "COMPLETED"
      const res = await fetch(`/api/items/${item.id}/todo-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setIsCompleted(!isCompleted)
      toast({
        title: isCompleted
          ? (locale === "zh" ? "已重新设为待办" : "Task marked as active")
          : (locale === "zh" ? "待办已办结" : "Task completed!"),
      })
      router.refresh()
    } catch (e) {
      toast({
        title: dict.common.notifications.updateFailed,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const categoryLabel = item.customCategory || item.layer

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        heading={item.title}
        text={item.whyPrompt || (locale === "zh" ? "单次待办事项" : "Single Action Task")}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/items/${item.id}/edit`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1"
            )}
          >
            <Icons.settings className="h-3.5 w-3.5" />
            <span>{dict.item.detail.configureButton}</span>
          </Link>
        </div>
      </DashboardHeader>

      {/* Task Status & Metadata Card */}
      <Card className="border-border/80 p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  isCompleted
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : isOverdue
                      ? "bg-red-500/15 text-red-700 dark:text-red-300"
                      : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isCompleted
                      ? "bg-emerald-500"
                      : isOverdue
                        ? "bg-red-500"
                        : "bg-blue-500"
                  )}
                />
                <span>
                  {isCompleted
                    ? (locale === "zh" ? "已办结" : "Completed")
                    : isOverdue
                      ? (locale === "zh" ? "已逾期" : "Overdue")
                      : (locale === "zh" ? "待办中" : "Pending")}
                </span>
              </span>

              {/* Category Tag */}
              {categoryLabel && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {categoryLabel}
                </span>
              )}
            </div>

            {/* Dates info */}
            <div className="space-y-1 text-xs text-muted-foreground">
              {item.dueDate && (
                <p>
                  <span className="font-medium text-foreground">
                    {locale === "zh" ? "截止日期：" : "Due Date: "}
                  </span>
                  <span
                    className={cn(
                      isOverdue && "font-semibold text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatLocalizedDate(item.dueDate, locale)}
                  </span>
                </p>
              )}
              <p>
                <span className="font-medium text-foreground">
                  {locale === "zh" ? "创建时间：" : "Created At: "}
                </span>
                {formatLocalizedDate(item.createdAt.toISOString().split("T")[0], locale)}
              </p>
            </div>
          </div>

          {/* Toggle Action Button */}
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={isLoading}
            className={cn(
              buttonVariants({
                variant: isCompleted ? "outline" : "default",
                size: "sm",
              }),
              "gap-1.5 self-start sm:self-auto"
            )}
          >
            <Icons.check className="h-4 w-4" />
            <span>
              {isCompleted
                ? (locale === "zh" ? "重新设为待办" : "Mark as Active")
                : (locale === "zh" ? "标记为已办结" : "Mark as Completed")}
            </span>
          </button>
        </div>
      </Card>

      {/* Connected Tools */}
      {item.toolLinks.length > 0 && (
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">
              {dict.item.detail.connectedToolsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-2.5">
              {item.toolLinks.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-primary shadow-xs hover:bg-muted"
                >
                  <span>{tool.title}</span>
                  <Icons.externalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CheckIns / Completion Log */}
      {item.checkIns && item.checkIns.length > 0 && (
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">
              {dict.item.detail.historyTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60 rounded-lg border">
              {item.checkIns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-foreground">
                      {formatLocalizedDate(c.date, locale)}
                    </span>
                    {c.actionText && (
                      <p className="text-[11px] text-muted-foreground">
                        {c.actionText}
                      </p>
                    )}
                  </div>
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {locale === "zh" ? "办结" : "Completed"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
