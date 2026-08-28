"use client"

import * as React from "react"
import Link from "next/link"
import { ItemDetailDTO, Layer } from "@/types"
import { ItemTrendData } from "@/lib/api/trends"
import { LAYERS } from "@/config/layers"
import { cn } from "@/lib/utils"
import { useI18n, formatLocalizedDate } from "@/lib/i18n"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/pages/dashboard/dashboard-header"
import { DualStreakCard } from "@/components/items/dual-streak-card"
import { HabitTrendChart } from "@/components/items/habit-trend-chart"
import { TodoDetailView } from "@/components/items/todo-detail-view"
import { Icons } from "@/components/icons"

interface ItemDetailViewProps {
  item: ItemDetailDTO
  streaks: {
    actionStreak: number
    rhythmStreak: number
    longestActionStreak: number
    maintainedDays: number
  }
  initialTrendData: ItemTrendData | null
}

export function ItemDetailView({
  item,
  streaks,
  initialTrendData,
}: ItemDetailViewProps) {
  const { dict, format, locale } = useI18n()

  // 1. Branch: If TODO, render dedicated TodoDetailView
  if (item.type === "TODO") {
    return <TodoDetailView item={item} />
  }

  const layerInfo = LAYERS[item.layer as Layer] || LAYERS.BODY
  const categoryLabel = item.customCategory || item.layer
  const totalCheckInsCount =
    item.checkIns?.filter(
      (c) =>
        c.status === "COMPLETED" ||
        c.status === "KEPT" ||
        c.status === "REST"
    ).length || 0
  const daysSinceCreation = Math.max(
    1,
    Math.ceil(
      (new Date().getTime() - new Date(item.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        heading={item.title}
        text={item.whyPrompt || dict.item.detail.defaultWhy}
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

      {/* Milestone & Category Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {categoryLabel && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              style={{
                borderColor: `${layerInfo.color}40`,
                backgroundColor: `${layerInfo.color}15`,
                color: layerInfo.color,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: layerInfo.color }}
              />
              <span>{categoryLabel}</span>
            </span>
          )}
          <span className="text-muted-foreground">
            {locale === "zh"
              ? `开启于 ${formatLocalizedDate(
                  item.createdAt.toISOString().split("T")[0],
                  locale
                )}`
              : `Started on ${formatLocalizedDate(
                  item.createdAt.toISOString().split("T")[0],
                  locale
                )}`}
          </span>
        </div>

        <div className="flex items-center gap-3 font-semibold text-foreground">
          <span>
            {locale === "zh"
              ? `已持续 ${daysSinceCreation} 天`
              : `${daysSinceCreation} days tracking`}
          </span>
          <span className="text-muted-foreground">·</span>
          <span>
            {locale === "zh"
              ? `累计打卡 ${totalCheckInsCount} 次`
              : `${totalCheckInsCount} check-ins`}
          </span>
        </div>
      </div>

      {/* 1. Dual Streak Cards */}
      <DualStreakCard
        actionStreak={streaks.actionStreak}
        rhythmStreak={streaks.rhythmStreak}
        longestActionStreak={streaks.longestActionStreak}
        maintainedDays={streaks.maintainedDays}
        type={item.type}
      />

      {/* 2. Habit Trend Chart & Heatmap */}
      {initialTrendData && <HabitTrendChart initialData={initialTrendData} />}

      {/* 3. Action Presets (If Habit) */}
      {item.type === "HABIT" && item.actionPresets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              {dict.item.detail.presetsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {item.actionPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="space-y-1 rounded-xl border border-border/80 bg-muted/20 p-3.5"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {preset.energyLevel} Energy
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {preset.actionText}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Tool Links */}
      {item.toolLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              {dict.item.detail.connectedToolsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2.5">
              {item.toolLinks.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-primary shadow-sm hover:bg-muted"
                >
                  <span>{tool.title}</span>
                  <Icons.externalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. CheckIn History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold tracking-tight">
            {dict.item.detail.historyTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!item.checkIns || item.checkIns.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {dict.item.detail.noHistory}
            </p>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border">
              {item.checkIns.slice(0, 30).map((c) => (
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
                    {c.notes && (
                      <p className="text-[11px] italic text-muted-foreground/80">
                        “{c.notes}”
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-semibold",
                        c.status === "REST"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          : c.status === "COMPLETED" || c.status === "KEPT"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.status === "REST"
                        ? locale === "zh"
                          ? "主动休整"
                          : "Rest"
                        : c.status === "KEPT"
                          ? locale === "zh"
                            ? "平稳保持"
                            : "Kept"
                          : c.actualEnergy || "Completed"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
