"use client"

import * as React from "react"
import { GrowthNarrativeResult } from "@/lib/domain/growth-narrative"
import { Card, CardContent } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface GrowthNarrativeHeroProps {
  narrative: GrowthNarrativeResult
}

export function GrowthNarrativeHero({ narrative }: GrowthNarrativeHeroProps) {
  const { dict: fullDict, locale } = useI18n()
  const dict = fullDict.insights.weeklyReview

  const { focusLayers, summaryNarrative, overallState } = narrative

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-6 shadow-sm">
      <div className="space-y-4">
        {/* Header Question */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icons.sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {dict.eyebrow}
            </span>
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {dict.question}
            </h2>
          </div>
        </div>

        {/* Narrative Synthesis Text */}
        <div className="rounded-xl border border-primary/10 bg-background/80 p-4 shadow-xs">
          <p className="text-sm font-medium leading-relaxed text-foreground/90 sm:text-base">
            {summaryNarrative}
          </p>

          {/* Focus Domain Chips */}
          {focusLayers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3">
              <span className="text-xs font-semibold text-muted-foreground">
                {locale === "zh" ? "主要投入：" : "Primary Focus:"}
              </span>
              {focusLayers.map((fl) => (
                <span
                  key={fl.layer}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  <span
                    className="h-2 w-2 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: fl.color }}
                  />
                  <span>{locale === "zh" ? fl.zhLabel : fl.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({fl.connectedCount} {locale === "zh" ? "次连接" : "connections"})
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Overall State Badge & Factual Basis */}
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              <Icons.compass className="h-3.5 w-3.5" />
              <span>{overallState.title}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {overallState.basis}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground/80">
            {dict.basisNote}
          </span>
        </div>
      </div>
    </Card>
  )
}
