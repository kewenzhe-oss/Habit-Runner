"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface EnergyContextPanelProps {
  energyDistribution: {
    HIGH: number
    NORMAL: number
    LOW: number
    REST: number
    UNLOGGED: number
  }
}

export function EnergyContextPanel({
  energyDistribution,
}: EnergyContextPanelProps) {
  const { dict: fullDict, format } = useI18n()
  const dict = fullDict.insights.energyPanel
  const [isExpanded, setIsExpanded] = React.useState(false)

  const totalLogged =
    energyDistribution.HIGH +
    energyDistribution.NORMAL +
    energyDistribution.LOW +
    energyDistribution.REST

  const energyItems = [
    {
      level: "HIGH",
      badge: dict.levelHighBadge,
      title: dict.levelHighTitle,
      sub: dict.levelHighSub,
      count: energyDistribution.HIGH,
      colorClass: "text-emerald-700 dark:text-emerald-300",
      bgClass: "bg-emerald-500/10 border-emerald-500/30",
      badgeClass:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
      icon: "highEnergy" as const,
    },
    {
      level: "NORMAL",
      badge: dict.levelNormalBadge,
      title: dict.levelNormalTitle,
      sub: dict.levelNormalSub,
      count: energyDistribution.NORMAL,
      colorClass: "text-blue-700 dark:text-blue-300",
      bgClass: "bg-blue-500/10 border-blue-500/30",
      badgeClass:
        "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
      icon: "normalEnergy" as const,
    },
    {
      level: "LOW",
      badge: dict.levelLowBadge,
      title: dict.levelLowTitle,
      sub: dict.levelLowSub,
      count: energyDistribution.LOW,
      colorClass: "text-amber-700 dark:text-amber-300",
      bgClass: "bg-amber-500/10 border-amber-500/30",
      badgeClass:
        "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
      icon: "lowEnergy" as const,
    },
    {
      level: "REST",
      badge: dict.levelRestBadge,
      title: dict.levelRestTitle,
      sub: dict.levelRestSub,
      count: energyDistribution.REST,
      colorClass: "text-purple-700 dark:text-purple-300",
      bgClass: "bg-purple-500/10 border-purple-500/30",
      badgeClass:
        "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
      icon: "rest" as const,
    },
  ]

  return (
    <Card className="overflow-hidden border-border/80 bg-muted/20 transition-all">
      {/* Clickable Header for Collapsible Energy Context */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="energy-context-details"
        className="flex min-h-11 w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icons.sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {dict.title}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {dict.tag}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {dict.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
            {isExpanded ? dict.collapseBtn : dict.expandBtn}
          </span>
          <Icons.next
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
        </div>
      </button>

      {/* Expanded Context Content */}
      {isExpanded && (
        <CardContent
          id="energy-context-details"
          className="space-y-3 border-t px-4 pb-4 pt-0"
        >
          <p className="pt-3 text-xs text-muted-foreground">
            {dict.detailIntro}
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {energyItems.map((item) => {
              const IconComp = Icons[item.icon]
              const percent =
                totalLogged > 0
                  ? Math.round((item.count / totalLogged) * 100)
                  : 0
              return (
                <div
                  key={item.level}
                  className={cn(
                    "flex flex-col justify-between space-y-2 rounded-xl border p-3",
                    item.bgClass
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <IconComp className={cn("h-4 w-4", item.colorClass)} />
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-bold",
                          item.badgeClass
                        )}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-foreground">
                        {item.count} {dict.daysSuffix}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        ({percent}%)
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {item.sub}
                  </p>
                </div>
              )
            })}
          </div>

          {energyDistribution.UNLOGGED > 0 && (
            <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
              {format(dict.unloggedNotice, { count: energyDistribution.UNLOGGED })}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
