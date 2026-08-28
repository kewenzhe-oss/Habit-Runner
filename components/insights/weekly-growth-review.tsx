"use client"

import * as React from "react"
import type { LayerGrowthMatrixData, LayerGrowthRow } from "@/types"

import { buildWeeklyGrowthReview } from "@/lib/domain/weekly-growth-review"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface WeeklyGrowthReviewProps {
  data: LayerGrowthMatrixData
}

function JourneyStrip({
  row,
  ariaLabel,
}: {
  row: LayerGrowthRow
  ariaLabel: string
}) {
  return (
    <div>
      <div className="grid grid-cols-12 gap-1" aria-hidden="true">
        {row.stability.weeklySeries.map((week) => (
          <span
            key={`${week.from}-${week.to}`}
            className={cn(
              "h-3 rounded-[3px] border",
              week.opportunityCount === 0
                ? "border-dashed border-muted-foreground/35 bg-transparent"
                : week.hasConnection
                  ? "border-primary/35 bg-primary/75"
                  : "border-border bg-muted"
            )}
          />
        ))}
      </div>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  )
}

export function WeeklyGrowthReview({ data }: WeeklyGrowthReviewProps) {
  const { dict: fullDict, locale, format } = useI18n()
  const dict = fullDict.insights.weeklyReview
  const phaseDict = fullDict.insights.growthMatrix.phase
  const review = React.useMemo(() => buildWeeklyGrowthReview(data), [data])

  const layerName = (row: LayerGrowthRow) => {
    const layer = fullDict.form.layers[row.layer]
    return locale === "zh" ? layer.zhLabel : layer.label
  }

  const joinLayerNames = (rows: LayerGrowthRow[]) => {
    const names = rows.map(layerName)
    if (names.length <= 1) return names[0] || ""
    if (locale === "zh") {
      return names.length === 2
        ? `${names[0]}和${names[1]}`
        : `${names.slice(0, -1).join("、")}和${names[names.length - 1]}`
    }
    return new Intl.ListFormat("en", {
      style: "long",
      type: "conjunction",
    }).format(names)
  }

  const focusText =
    review.focusLayers.length > 0
      ? format(dict.focusWithLayers, {
          layers: joinLayerNames(review.focusLayers),
        })
      : dict.focusEmpty

  const evidenceText =
    review.establishedLayerCount > 0
      ? format(dict.evidenceEstablished, {
          connected: review.connectedLayerCount,
          established: review.establishedLayerCount,
        })
      : review.connectedLayerCount > 0
        ? format(dict.evidenceSettling, {
            connected: review.connectedLayerCount,
          })
        : dict.evidenceEmpty

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-5 sm:p-7">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Icons.compass className="h-4 w-4" aria-hidden="true" />
            <span>{dict.eyebrow}</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
              {dict.question}
            </h2>
            <p className="text-base font-medium leading-relaxed text-foreground sm:text-lg">
              {focusText}
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-start sm:gap-3">
            <span className="w-fit shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {locale === "zh" ? `整体状态：${dict.states[review.overallState]}` : `Phase: ${dict.states[review.overallState]}`}
            </span>
            <div className="space-y-1">
              <p className="text-sm leading-relaxed text-foreground">
                {dict.stateDescriptions[review.overallState]}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {locale === "zh" ? `依据：${evidenceText}` : `Basis: ${evidenceText}`}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <section aria-labelledby="growth-journey-title" className="space-y-3">
        <div className="space-y-1">
          <h2
            id="growth-journey-title"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {review.establishedLayerCount > 0
              ? dict.journeyTitle
              : dict.settlingTitle}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {dict.journeyDescription}
          </p>
        </div>

        {review.journeyLayers.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {review.journeyLayers.map((row) => {
              const trackText =
                row.stability.eligibleWeeks > 0
                  ? format(dict.weeksConnected, {
                      connected: row.stability.connectedWeeks,
                      eligible: row.stability.eligibleWeeks,
                    })
                  : dict.noTrack

              return (
                <Card
                  key={row.layer}
                  className="space-y-4 border-border/80 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
                        style={{ backgroundColor: row.color }}
                        aria-hidden="true"
                      />
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {layerName(row)}
                      </h3>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {phaseDict[row.phase]}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
                      {dict.trackLabel}
                    </p>
                    <JourneyStrip row={row} ariaLabel={trackText} />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium leading-relaxed text-foreground">
                      {trackText}
                    </p>
                    {row.stability.eligibleWeeks > 0 && (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {row.stability.currentConnectedRun > 0
                          ? format(dict.runContinues, {
                              count: row.stability.currentConnectedRun,
                            })
                          : dict.runSettling}
                      </p>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed bg-muted/15 p-4 text-sm leading-relaxed text-muted-foreground">
            {dict.noJourneyYet}
          </Card>
        )}
      </section>

      <section aria-labelledby="next-step-title" className="space-y-3">
        <div className="space-y-1">
          <h2
            id="next-step-title"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {dict.nextTitle}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {dict.nextDescription}
          </p>
        </div>

        <Card className="grid overflow-hidden border-primary/15 md:grid-cols-2">
          <div className="space-y-2 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Icons.check className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3>{dict.keepTitle}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {review.keepLayer
                ? format(dict.keepWithLayer, {
                    layer: layerName(review.keepLayer),
                  })
                : dict.keepFallback}
            </p>
          </div>

          <div className="space-y-2 border-t bg-muted/15 p-4 sm:p-5 md:border-l md:border-t-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Icons.sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3>{dict.gentleTitle}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {review.gentleLayer
                ? format(dict.gentleWithLayer, {
                    layer: layerName(review.gentleLayer),
                  })
                : dict.noGentle}
            </p>
          </div>
        </Card>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {dict.basisNote}
        </p>
      </section>
    </div>
  )
}
