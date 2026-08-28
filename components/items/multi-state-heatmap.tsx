"use client"

import * as React from "react"
import { CheckIn } from "@prisma/client"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface MultiStateHeatmapProps {
  checkIns: CheckIn[]
  startDate?: string
  endDate?: string
}

export function MultiStateHeatmap({ checkIns }: MultiStateHeatmapProps) {
  // Map date to checkin
  const checkInMap = new Map<string, CheckIn>()
  checkIns.forEach((c) => checkInMap.set(c.date, c))

  // Generate last 112 days (16 weeks x 7 days)
  const days: Array<{ dateStr: string; dayOfWeek: number; checkIn?: CheckIn }> =
    []
  const today = new Date()

  for (let i = 111; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    days.push({
      dateStr,
      dayOfWeek: d.getDay(),
      checkIn: checkInMap.get(dateStr),
    })
  }

  // Get color for checkin
  const getColorClass = (c?: CheckIn) => {
    if (!c) return "bg-muted/50 border border-transparent"

    if (c.status === "REST") {
      return "bg-purple-500 text-white ring-1 ring-purple-600/30"
    }
    if (c.status === "KEPT") {
      return "bg-emerald-500 text-white ring-1 ring-emerald-600/30"
    }
    if (c.status === "LAPSED") {
      return "bg-orange-400 dark:bg-orange-600 text-white ring-1 ring-orange-500/30"
    }

    if (c.status === "COMPLETED") {
      if (c.actualEnergy === "HIGH") {
        return "bg-emerald-600 dark:bg-emerald-500 text-white ring-1 ring-emerald-600/30"
      }
      if (c.actualEnergy === "LOW") {
        return "bg-amber-500 text-white ring-1 ring-amber-600/30"
      }
      return "bg-emerald-400 dark:bg-emerald-500 text-white ring-1 ring-emerald-500/30"
    }

    return "bg-muted text-muted-foreground"
  }

  return (
    <Card className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            近 16 周运行轨迹 (Multi-State Timeline)
          </h3>
          <p className="text-xs text-muted-foreground">
            微行动与主动休整均真实保留在时间线连接中。
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
            <span>High 充沛</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            <span>Normal 平稳</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            <span>Low 微小连接</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-purple-500" />
            <span>Rest 主动休整</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm border bg-muted" />
            <span>无记录</span>
          </div>
        </div>
      </div>

      {/* Grid of days */}
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[640px] grid-flow-col grid-rows-7 gap-1.5">
          {days.map(({ dateStr, checkIn }) => (
            <div
              key={dateStr}
              title={`${dateStr}: ${
                checkIn
                  ? checkIn.status === "REST"
                    ? "主动恢复休整 (Rest)"
                    : checkIn.actualEnergy === "LOW"
                      ? `低能量微行动 (${checkIn.actionText || "已完成"})`
                      : `${checkIn.status} (${checkIn.actualEnergy || "已完成"})`
                  : "无记录"
              }`}
              className={cn(
                "h-3.5 w-3.5 cursor-pointer rounded-sm transition-transform hover:scale-125",
                getColorClass(checkIn)
              )}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
