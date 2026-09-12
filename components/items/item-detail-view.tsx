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
  const { dict, locale } = useI18n()

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

  const highPreset = item.actionPresets?.find((p) => p.energyLevel === "HIGH")
  const normalPreset = item.actionPresets?.find((p) => p.energyLevel === "NORMAL")
  const lowPreset = item.actionPresets?.find((p) => p.energyLevel === "LOW")

  return (
    <div className="space-y-6">
      {/* 1. Top Header */}
      <DashboardHeader
        heading={item.title}
        text={item.whyPrompt || dict.item.detail.defaultWhy}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/items/${item.id}/edit`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 font-medium shadow-xs"
            )}
          >
            <Icons.settings className="h-3.5 w-3.5" />
            <span>{dict.item.detail.configureButton}</span>
          </Link>
        </div>
      </DashboardHeader>

      {/* 2. Milestone & Category Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3.5 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
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

      {/* 3. Action Blueprint Cockpit (三档能量行动指南 - 前置核心区) */}
      {item.type === "HABIT" && (
        <Card className="overflow-hidden border-border/80">
          <CardHeader className="bg-muted/15 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  🎯 三档行动能量蓝图
                </CardTitle>
                <span className="text-[11px] text-muted-foreground">
                  根据每日精力动态调节负荷，保证习惯永不断连
                </span>
              </div>
              <Link
                href={`/items/${item.id}/edit`}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                调整预设
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* High Energy Blueprint */}
              <div className="space-y-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    <Icons.fire className="h-3 w-3" />
                    <span>HIGH 充沛推进</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">攻坚状态</span>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {highPreset?.actionText || "未设置充沛动作（建议设定深度攻坚内容）"}
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  状态最佳时全力以赴，取得实质性突破
                </p>
              </div>

              {/* Normal Energy Blueprint */}
              <div className="space-y-1.5 rounded-xl border border-border/80 bg-muted/20 p-3.5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-bold text-foreground">
                    <Icons.normalEnergy className="h-3 w-3 text-emerald-600" />
                    <span>NORMAL 标准基准</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">常规状态</span>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {normalPreset?.actionText || "未设置标准动作（建议设定日常基准内容）"}
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  日常工作节奏，无额外负担稳步践行
                </p>
              </div>

              {/* Low Energy Blueprint */}
              <div className="space-y-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    <Icons.lowEnergy className="h-3 w-3" />
                    <span>LOW 微小连接</span>
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80">最低阻力</span>
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {lowPreset?.actionText || "未设置微动作（如：读 1 页书、打开文档写 1 行）"}
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  精疲力竭或时间紧迫时的安全兜底，守护火苗
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Dual Streak Cards */}
      <DualStreakCard
        actionStreak={streaks.actionStreak}
        rhythmStreak={streaks.rhythmStreak}
        longestActionStreak={streaks.longestActionStreak}
        maintainedDays={streaks.maintainedDays}
        type={item.type}
      />

      {/* 5. Habit Trend Chart & Heatmap Cockpit */}
      {initialTrendData && <HabitTrendChart initialData={initialTrendData} />}

      {/* 6. Tool Links (If any) */}
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

      {/* 7. Footprint & Flow Journal (习惯足迹与心流时间轴) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold tracking-tight">
                🌱 习惯足迹与心流日志
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">
                记录每一次行动反思与明日种子
              </span>
            </div>
            <span className="rounded-full bg-muted/40 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground border">
              共 {item.checkIns?.length || 0} 次记录
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {!item.checkIns || item.checkIns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                <Icons.sparkles className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-foreground">尚无足迹记录</p>
              <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                每一次微小行动，都是系统生长的印记。今天就完成一次打卡吧！
              </p>
            </div>
          ) : (
            <div className="relative ml-2 space-y-4 border-l-2 border-border/80 pl-4 pt-1 sm:ml-4 sm:pl-6">
              {item.checkIns.slice(0, 30).map((c) => (
                <div key={c.id} className="relative group">
                  {/* Timeline node icon */}
                  <span
                    className={cn(
                      "absolute -left-[23px] sm:-left-[31px] top-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border-2 bg-background shadow-xs",
                      c.status === "REST"
                        ? "border-purple-500 text-purple-600"
                        : c.actualEnergy === "HIGH"
                          ? "border-emerald-600 text-emerald-600"
                          : c.actualEnergy === "LOW"
                            ? "border-amber-500 text-amber-600"
                            : "border-emerald-500 text-emerald-500"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        c.status === "REST"
                          ? "bg-purple-500"
                          : c.actualEnergy === "HIGH"
                            ? "bg-emerald-600"
                            : c.actualEnergy === "LOW"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                      )}
                    />
                  </span>

                  {/* CheckIn Content Card */}
                  <div className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-3.5 text-xs shadow-xs transition-colors hover:border-border hover:bg-muted/15">
                    {/* Header: Date + Energy Pill + Action Text */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {formatLocalizedDate(c.date, locale)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                            c.status === "REST"
                              ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800"
                              : c.actualEnergy === "HIGH"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800"
                                : c.actualEnergy === "LOW"
                                  ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800"
                          )}
                        >
                          {c.status === "REST"
                            ? "☕️ 主动休整"
                            : c.actualEnergy === "HIGH"
                              ? "⚡️ High 充沛"
                              : c.actualEnergy === "LOW"
                                ? "🪫 Low 微连接"
                                : "🔋 Normal 标准"}
                        </span>
                      </div>
                      {c.actionText && (
                        <span className="font-medium text-foreground">
                          {c.actionText}
                        </span>
                      )}
                    </div>

                    {/* Reflection / Notes */}
                    {c.notes && (
                      <blockquote className="rounded-lg border-l-2 border-primary/40 bg-muted/30 px-3 py-2 text-[11px] italic text-muted-foreground leading-relaxed">
                        “{c.notes}”
                      </blockquote>
                    )}

                    {/* Next Intent (🌱 明日推进) */}
                    {c.nextIntent && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                        <Icons.sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          <strong>明日推进：</strong>
                          {c.nextIntent}
                        </span>
                      </div>
                    )}
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
