"use client"

import { LayerGrowthMatrixData, LayerGrowthRow } from "@/types"

import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface LayerGrowthMatrixProps {
  data: LayerGrowthMatrixData
  embedded?: boolean
}

function LayerIdentity({
  row,
  itemText,
  phaseText,
}: {
  row: LayerGrowthRow
  itemText: string
  phaseText: string
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
            style={{ backgroundColor: row.color }}
            aria-hidden="true"
          />
          <span className="truncate font-semibold text-foreground">
            {row.label}
          </span>
        </span>
        <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
          {phaseText}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{itemText}</p>
    </div>
  )
}

function StabilityStrip({
  row,
  ariaLabel,
}: {
  row: LayerGrowthRow
  ariaLabel: string
}) {
  return (
    <div>
      <div
        className="grid grid-cols-12 gap-1"
        aria-hidden="true"
        title={ariaLabel}
      >
        {row.stability.weeklySeries.map((week) => (
          <span
            key={`${week.from}-${week.to}`}
            className={cn(
              "h-3 rounded-[3px] border",
              week.opportunityCount === 0
                ? "border-dashed border-muted-foreground/35 bg-transparent"
                : week.hasConnection
                  ? "border-primary/30 bg-primary/70"
                  : "border-border bg-muted"
            )}
          />
        ))}
      </div>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  )
}

export function LayerGrowthMatrix({
  data,
  embedded = false,
}: LayerGrowthMatrixProps) {
  const { dict: fullDict, format } = useI18n()
  const dict = fullDict.insights.growthMatrix

  const renderConnectionTrend = (row: LayerGrowthRow) => {
    const momentumIsReadable =
      row.momentum.sampleState === "SUFFICIENT" &&
      row.momentum.deltaPercentagePoints !== null &&
      row.momentum.currentScore !== null &&
      row.momentum.previousScore !== null

    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
            {dict.connectionLabel}
          </p>
          <span className="block text-xl font-bold tabular-nums text-foreground">
            {row.foundation.score === null ? "—" : `${row.foundation.score}%`}
          </span>
          {row.foundation.score !== null && (
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={format(dict.scoreLabel, {
                score: row.foundation.score,
              })}
            >
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${row.foundation.score}%` }}
              />
            </div>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {format(dict.connectionEvidence, {
              connected: row.foundation.connectedCount,
              opportunities: row.foundation.opportunityCount,
            })}
          </p>
        </div>

        <div className="space-y-2 border-t pt-3 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
            {dict.trendLabel}
          </p>
          {momentumIsReadable ? (
            <>
              <p
                className={cn(
                  "text-base font-bold tabular-nums",
                  row.momentum.deltaPercentagePoints! > 0
                    ? "text-primary"
                    : row.momentum.deltaPercentagePoints! < 0
                      ? "text-muted-foreground"
                      : "text-foreground"
                )}
              >
                {row.momentum.deltaPercentagePoints! > 0 ? "+" : ""}
                {format(dict.delta, {
                  delta: row.momentum.deltaPercentagePoints!,
                })}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {format(dict.currentPrevious, {
                  current: row.momentum.currentScore!,
                  previous: row.momentum.previousScore!,
                })}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">
              {dict.sample[row.momentum.sampleState]}
            </p>
          )}
        </div>
      </div>
    )
  }

  const renderStability = (row: LayerGrowthRow) => {
    const summary =
      row.stability.eligibleWeeks > 0
        ? format(dict.connectedWeeks, {
            connected: row.stability.connectedWeeks,
            eligible: row.stability.eligibleWeeks,
          })
        : dict.noEligibleWeeks

    return (
      <div className="space-y-2">
        <StabilityStrip row={row} ariaLabel={summary} />
        <p className="text-xs font-medium text-foreground">{summary}</p>
        {row.stability.eligibleWeeks > 0 && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {row.stability.currentConnectedRun > 0
              ? format(dict.currentRun, {
                  count: row.stability.currentConnectedRun,
                })
              : dict.noCurrentRun}
          </p>
        )}
      </div>
    )
  }

  const renderIdentity = (row: LayerGrowthRow) => (
    <LayerIdentity
      row={row}
      itemText={format(dict.itemCount, { count: row.itemCount })}
      phaseText={dict.phase[row.phase]}
    />
  )

  return (
    <Card
      className={cn(
        "overflow-hidden border-primary/15",
        embedded && "rounded-none border-0 shadow-none"
      )}
    >
      <CardHeader className="space-y-4 pb-4">
        {!embedded && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icons.layers className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight">
                    {dict.title}
                  </h2>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {dict.tag}
                  </span>
                </div>
                <CardDescription className="max-w-3xl text-sm leading-relaxed">
                  {dict.description}
                </CardDescription>
              </div>
            </div>
            <span className="w-fit shrink-0 rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
              {dict.rangeBadge}
            </span>
          </div>
        )}

        <details className="group rounded-lg border bg-muted/15">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Icons.mixer className="h-4 w-4" aria-hidden="true" />
              <span>{dict.methodTitle}</span>
              <span className="text-xs font-normal text-muted-foreground/75">
                {dict.methodHint}
              </span>
            </span>
            <Icons.next
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
          </summary>
          <div className="space-y-4 border-t px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            <div>
              <span className="mb-1.5 inline-flex rounded bg-background px-1.5 py-0.5 font-semibold text-foreground ring-1 ring-border">
                {dict.basisTag}
              </span>
              <p>{dict.basisText}</p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-background/70 p-2.5">
                <dt className="font-medium text-foreground">
                  {dict.planBasisLabel}
                </dt>
                <dd className="mt-1 break-all font-mono text-[11px]">
                  {data.dataBasis.planBasis}
                </dd>
              </div>
              <div className="rounded-md bg-background/70 p-2.5">
                <dt className="font-medium text-foreground">
                  {dict.historyCompleteLabel}
                </dt>
                <dd className="mt-1">
                  <span className="font-mono text-[11px]">
                    {String(data.dataBasis.historyComplete)}
                  </span>
                  <span> · {dict.historyIncomplete}</span>
                </dd>
              </div>
            </dl>

            <div className="space-y-1.5">
              <p>{dict.equalWeightNote}</p>
              <p>{dict.sharedItemsNote}</p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">{dict.cohortTitle}</p>
              <ul className="grid gap-x-5 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
                {data.layers.map((row) => (
                  <li
                    key={row.layer}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{row.label}</span>
                    <span className="shrink-0 tabular-nums">
                      {format(dict.comparableItems, {
                        count: row.momentum.comparableItemCount,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p>{dict.weekLegend}</p>
          </div>
        </details>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="space-y-3 md:hidden">
          {data.layers.map((row) => (
            <article
              key={row.layer}
              className="space-y-4 rounded-xl border p-4"
            >
              {renderIdentity(row)}

              <dl className="grid gap-5 border-t pt-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <dt className="text-xs font-semibold text-foreground">
                    {dict.colConnectionTrend}
                  </dt>
                  <dd>{renderConnectionTrend(row)}</dd>
                </div>
                <div className="space-y-3">
                  <dt className="text-xs font-semibold text-foreground">
                    {dict.colContinuity}
                  </dt>
                  <dd>{renderStability(row)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-xl border md:block">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">{dict.description}</caption>
            <thead className="bg-muted/35 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="w-[27%] px-4 py-3 font-semibold">
                  {dict.colLayerStatus}
                </th>
                <th scope="col" className="w-[40%] px-4 py-3 font-semibold">
                  {dict.colConnectionTrend}
                </th>
                <th scope="col" className="w-[33%] px-4 py-3 font-semibold">
                  {dict.colContinuity}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.layers.map((row) => (
                <tr key={row.layer} className="border-t align-top">
                  <th scope="row" className="px-4 py-4 text-left font-normal">
                    {renderIdentity(row)}
                  </th>
                  <td className="px-4 py-4">{renderConnectionTrend(row)}</td>
                  <td className="px-4 py-4">{renderStability(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
