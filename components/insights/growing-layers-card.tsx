"use client"

import * as React from "react"
import { GrowingLayerItem } from "@/lib/domain/growth-narrative"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface GrowingLayersCardProps {
  layers: GrowingLayerItem[]
}

export function GrowingLayersCard({ layers }: GrowingLayersCardProps) {
  const { dict: fullDict, locale } = useI18n()
  const dict = fullDict.insights.weeklyReview

  return (
    <Card className="overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center gap-2">
          <Icons.spa className="h-4 w-4 text-emerald-600/70 dark:text-emerald-400/70" />
          <CardTitle className="text-base font-bold tracking-tight text-foreground">
            {dict.journeyTitle}
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {dict.journeyDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {layers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-xs leading-relaxed text-muted-foreground">
            <p>{dict.noJourneyYet}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {layers.map((item) => (
              <div
                key={item.layer}
                className="flex flex-col justify-between space-y-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="space-y-2">
                  {/* Layer Name + Phase Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-foreground">
                        {locale === "zh" ? item.zhLabel : item.label}
                      </span>
                    </div>
                    <span className="rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {item.phaseLabel}
                    </span>
                  </div>

                  {/* 12-Week Visual Trajectory Strip */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{dict.trackLabel}</span>
                      <span>
                        {item.connectedWeeks} / {item.eligibleWeeks || 12}{" "}
                        {locale === "zh" ? "周连接" : "wks"}
                      </span>
                    </div>
                    <div
                      className="grid grid-cols-12 gap-1"
                      aria-label={`${item.connectedWeeks} of ${item.eligibleWeeks} weeks connected`}
                    >
                      {item.weeklySeries.map((week) => (
                        <span
                          key={`${week.from}-${week.to}`}
                          className={cn(
                            "h-3 rounded-[3px] border transition-colors",
                            week.opportunityCount === 0
                              ? "border-dashed border-muted-foreground/30 bg-transparent"
                              : week.hasConnection
                                ? "border-primary/40 bg-primary/80"
                                : "border-border bg-muted/60"
                          )}
                          title={`${week.from} ~ ${week.to}: ${
                            week.hasConnection
                              ? locale === "zh" ? "有连接记录" : "Connected"
                              : locale === "zh" ? "有计划未打卡" : "Planned"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1-Line Concrete Factual Description */}
                <p className="border-t border-border/50 pt-2 text-xs leading-relaxed text-muted-foreground">
                  {item.factDescription}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
