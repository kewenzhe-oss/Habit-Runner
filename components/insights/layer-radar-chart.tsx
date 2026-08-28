"use client"

import * as React from "react"
import { LayerGrowthRow } from "@/types"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import { useI18n } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface LayerRadarChartProps {
  data: LayerGrowthRow[]
}

export function LayerRadarChart({ data }: LayerRadarChartProps) {
  const { dict: fullDict, locale, format } = useI18n()
  const dict = fullDict.insights.radarChart
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const radarData = React.useMemo(
    () =>
      (data || []).map((row) => {
        const layerConfig = fullDict.form.layers[row.layer]
        return {
          layer: row.layer,
          name:
            locale === "zh"
              ? layerConfig?.zhLabel || row.label || row.layer
              : layerConfig?.label || row.label || row.layer,
          fullName: layerConfig
            ? `${layerConfig.label} · ${layerConfig.zhLabel}`
            : row.label || row.layer,
          rate:
            typeof row.foundation?.score === "number"
              ? row.foundation.score
              : null,
          connected: row.foundation?.connectedCount ?? 0,
          opportunities: row.foundation?.opportunityCount ?? 0,
          color: row.color || "#8B5CF6",
        }
      }),
    [data, fullDict, locale]
  )
  const chartData = React.useMemo(
    () => radarData.map((item) => ({ ...item, chartRate: item.rate })),
    [radarData]
  )

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const item = payload[0].payload
    return (
      <div className="space-y-1 rounded-lg border bg-background/95 p-3 text-xs shadow-lg backdrop-blur">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <span
            className="h-2.5 w-2.5 rounded-full ring-1 ring-border"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span>{item.fullName}</span>
        </div>
        <div className="font-semibold text-foreground">
          {item.rate === null
            ? dict.noPlan
            : format(dict.connectionRate, { rate: `${item.rate}%` })}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {format(dict.connectionDetail, {
            count: item.connected,
            opportunities: item.opportunities,
          })}
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden bg-muted/10">
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icons.compass className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {dict.title}
                </h2>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {dict.auxiliaryTag}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {dict.description}
              </p>
            </div>
          </div>
          <Icons.next className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90" />
        </summary>

        <CardContent className="space-y-4 border-t px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
          <p className="rounded-lg border border-dashed bg-background/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            {dict.disclaimer}
          </p>

          <div className="relative flex h-64 w-full items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="72%"
                  data={chartData}
                >
                  <PolarGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                  />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--foreground))",
                      fontWeight: 600,
                    }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar
                    name={dict.tableColRate}
                    dataKey="chartRate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.22}
                    connectNulls={false}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-muted-foreground">
                {dict.loading}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {dict.tableColLayer}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {dict.tableColActual}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {dict.tableColPlan}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {dict.tableColRate}
                  </th>
                </tr>
              </thead>
              <tbody>
                {radarData.map((item) => (
                  <tr key={item.layer} className="border-t">
                    <th scope="row" className="px-3 py-2 font-medium">
                      {item.fullName}
                    </th>
                    <td className="px-3 py-2 tabular-nums">{item.connected}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {item.opportunities}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {item.rate === null ? "—" : `${item.rate}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </details>
    </Card>
  )
}
