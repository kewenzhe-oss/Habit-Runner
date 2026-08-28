"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ItemTrendData } from "@/lib/api/trends"
import { cn } from "@/lib/utils"
import {
  useI18n,
  formatLocalizedDateRange,
  formatLocalizedTimes,
  formatLocalizedUnit,
} from "@/lib/i18n"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface HabitTrendChartProps {
  initialData: ItemTrendData
}

export function HabitTrendChart({ initialData }: HabitTrendChartProps) {
  const { dict: fullDict, locale, format } = useI18n()
  const dict = fullDict.item.trendChart
  const [data, setData] = React.useState<ItemTrendData>(initialData)
  const [rangeDays, setRangeDays] = React.useState<30 | 90>(
    initialData.rangeDays === 90 ? 90 : 30
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleRangeChange = async (newRange: 30 | 90) => {
    if (newRange === rangeDays) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/items/${data.itemId}/trend?rangeDays=${newRange}`)
      if (!res.ok) throw new Error("Failed to fetch trend")
      const updated = await res.json()
      setData(updated)
      setRangeDays(newRange)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  // 1. Habit: Heatmap Cell Color Class
  const getHeatmapColorClass = (point: ItemTrendData["dailyPoints"][0]) => {
    if (!point.isScheduled) return "bg-transparent border border-dashed border-muted-foreground/30"
    if (point.status === "REST") return "bg-purple-500 text-white dark:bg-purple-600"
    if (point.actualEnergy === "HIGH") return "bg-emerald-700 text-white dark:bg-emerald-600"
    if (point.actualEnergy === "NORMAL" || point.status === "COMPLETED") return "bg-emerald-500 text-white dark:bg-emerald-500"
    if (point.actualEnergy === "LOW") return "bg-amber-500 text-white dark:bg-amber-600"
    return "bg-muted/60 border border-border"
  }

  // 2. Quit Habit: Custom Tooltip for Occurrences Trend
  const QuitTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload
      const count = p.occurrenceCount
      const isZero = count === 0
      const formattedDateRange = formatLocalizedDateRange(p.startDate, p.endDate, locale)

      return (
        <div className="space-y-1 rounded-lg border bg-background/95 p-3 text-xs shadow-lg backdrop-blur">
          <div className="font-bold text-foreground">{p.weekLabel}</div>
          <div className="text-[11px] text-muted-foreground">
            {formattedDateRange}
          </div>
          <div className="flex items-center gap-2 border-t pt-1">
            <span className="font-semibold text-foreground">
              {dict.tooltipOccurrences}
              <span
                className={
                  isZero
                    ? "font-bold text-emerald-700 dark:text-emerald-300"
                    : "font-bold text-amber-700 dark:text-amber-300"
                }
              >
                {count === null ? dict.unrecordedLabel : formatLocalizedTimes(count, locale)}
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({format(dict.tooltipRecordedDays, { recorded: p.recordedDays, scheduled: p.scheduledDays })})
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  // 3. Todo: Custom Tooltip for Completion Rate
  const TodoTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload
      const formattedDateRange = formatLocalizedDateRange(p.startDate, p.endDate, locale)

      return (
        <div className="space-y-1 rounded-lg border bg-background/95 p-3 text-xs shadow-lg backdrop-blur">
          <div className="font-bold text-foreground">{p.weekLabel}</div>
          <div className="text-[11px] text-muted-foreground">
            {formattedDateRange}
          </div>
          <div className="border-t pt-1 font-semibold text-foreground">
            {dict.tooltipTodoRate}
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {p.completionRate}%
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-col justify-between gap-2 pb-2 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold tracking-tight">
              {data.type === "QUIT_HABIT"
                ? dict.titleQuit
                : data.type === "TODO"
                  ? dict.titleTodo
                  : dict.titleHabit}
            </CardTitle>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {data.type === "QUIT_HABIT" ? dict.tagQuit : dict.tagHabit}
            </span>
          </div>
          <CardDescription className="text-xs">
            {data.type === "QUIT_HABIT"
              ? dict.descQuit
              : data.type === "TODO"
                ? dict.descTodo
                : dict.descHabit}
          </CardDescription>
        </div>

        {/* Time Window Switcher (30 days / 90 days) */}
        <div className="flex items-center gap-1 self-start rounded-lg bg-muted/60 p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => handleRangeChange(30)}
            disabled={isLoading}
            aria-pressed={rangeDays === 30}
            className={cn(
              "min-h-11 rounded-md px-3 py-2 text-xs font-semibold transition-all",
              rangeDays === 30
                ? "shadow-xs bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {dict.range30}
          </button>
          <button
            type="button"
            onClick={() => handleRangeChange(90)}
            disabled={isLoading}
            aria-pressed={rangeDays === 90}
            className={cn(
              "min-h-11 rounded-md px-3 py-2 text-xs font-semibold transition-all",
              rangeDays === 90
                ? "shadow-xs bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {dict.range90}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* TYPE 1: POSITIVE HABIT */}
        {data.type === "HABIT" && (
          <div className="space-y-4">
            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">
                统计区间：{data.startDate} 至 {data.endDate}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="rounded-xs h-2.5 w-2.5 bg-emerald-700 ring-1 ring-border" />
                  <span>{dict.legendHigh}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="rounded-xs h-2.5 w-2.5 bg-emerald-500 ring-1 ring-border" />
                  <span>{dict.legendNormal}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="rounded-xs h-2.5 w-2.5 bg-amber-500 ring-1 ring-border" />
                  <span>{dict.legendLow}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="rounded-xs h-2.5 w-2.5 bg-purple-500 ring-1 ring-border" />
                  <span>{dict.legendRest}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="rounded-xs h-2.5 w-2.5 border bg-muted/60" />
                  <span>{dict.legendNoRecord}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="rounded-xs h-2.5 w-2.5 border border-dashed border-muted-foreground/40" />
                  <span>{dict.legendNotScheduled}</span>
                </div>
              </div>
            </div>

            {/* Matrix Grid with X & Y Coordinates */}
            <div className="overflow-x-auto pb-2">
              <div className="flex items-start gap-2">
                {/* Y-axis Weekday labels */}
                <div className="grid grid-rows-7 gap-1.5 pt-0.5 text-[9px] font-medium text-muted-foreground/70">
                  {(locale === "zh"
                    ? ["一", "", "三", "", "五", "", "日"]
                    : ["M", "", "W", "", "F", "", "S"]
                  ).map((lbl, i) => (
                    <div
                      key={i}
                      className="flex h-5 w-4 items-center justify-center"
                    >
                      {lbl}
                    </div>
                  ))}
                </div>

                {/* Grid of days */}
                <div
                  className="grid grid-flow-col grid-rows-7 gap-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${Math.ceil(
                      data.dailyPoints.length / 7
                    )}, minmax(16px, 1fr))`,
                  }}
                >
                  {data.dailyPoints.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      aria-label={`${d.date}: ${
                        !d.isScheduled
                          ? dict.legendNotScheduled
                          : d.status === "REST"
                            ? dict.legendRest
                            : d.actualEnergy === "LOW"
                              ? dict.legendLow
                              : d.status === "COMPLETED"
                                ? `${d.actualEnergy || "Normal"} ${locale === "zh" ? "完成" : "Done"}`
                                : dict.legendNoRecord
                      }`}
                      title={`${d.date}: ${
                        !d.isScheduled
                          ? dict.legendNotScheduled
                          : d.status === "REST"
                            ? dict.legendRest
                            : d.actualEnergy === "LOW"
                              ? `${dict.legendLow} (${d.actionText || "Micro"})`
                              : d.status === "COMPLETED"
                                ? `${d.actualEnergy || "Normal"}`
                                : dict.legendNoRecord
                      }`}
                      className={cn(
                        "h-5 w-5 rounded-xs transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        getHeatmapColorClass(d)
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Summary metrics pills */}
            <div className="grid grid-cols-2 gap-2 border-t pt-2 text-xs sm:grid-cols-4">
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statValidActionDays}
                </span>
                <div className="text-base font-bold text-foreground">
                  {data.summary.totalCompleted}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {locale === "zh" ? "天" : (data.summary.totalCompleted === 1 ? "day" : "days")}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statRestDays}
                </span>
                <div className="text-base font-bold text-purple-700 dark:text-purple-300">
                  {data.summary.totalRestDays}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {locale === "zh" ? "天" : (data.summary.totalRestDays === 1 ? "day" : "days")}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statLowEnergyCount}
                </span>
                <div className="text-base font-bold text-amber-700 dark:text-amber-300">
                  {
                    data.dailyPoints.filter((d) => d.actualEnergy === "LOW")
                      .length
                  }{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {locale === "zh" ? "次" : "times"}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statTotalRate}
                </span>
                <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {data.summary.completionRate}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TYPE 2: QUIT HABIT */}
        {data.type === "QUIT_HABIT" && (
          <div className="space-y-4">
            <div className="h-56 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.weeklyPoints}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="occurrenceGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#EA580C"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#EA580C"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.8}
                    />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--foreground))",
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, "auto"]}
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--foreground))",
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<QuitTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="occurrenceCount"
                      stroke="#EA580C"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#occurrenceGradient)"
                      connectNulls={false}
                      dot={{
                        r: 4.5,
                        fill: "#EA580C",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      activeDot={{ r: 6.5, fill: "#EA580C" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  加载频次图表中...
                </div>
              )}
            </div>

            {/* Quit Summary Metrics */}
            <div className="grid grid-cols-2 gap-2 border-t pt-2 text-xs sm:grid-cols-4">
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statTotalKeptDays}
                </span>
                <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {data.summary.totalKeptDays}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {locale === "zh" ? "天" : (data.summary.totalKeptDays === 1 ? "day" : "days")}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statTotalOccurrences}
                </span>
                <div className="text-base font-bold text-amber-700 dark:text-amber-300">
                  {data.summary.totalOccurrences ?? data.summary.totalLapses}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {locale === "zh" ? "次" : "times"}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statZeroWeeks}
                </span>
                <div className="text-base font-bold text-foreground">
                  {data.summary.fullyObservedZeroWeeks}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    / {data.weeklyPoints.length} {locale === "zh" ? "周" : "wks"}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statObservationRate}
                </span>
                <div className="text-base font-bold text-foreground">
                  {data.summary.observationRate}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TYPE 3: TODO */}
        {data.type === "TODO" && (
          <div className="space-y-4">
            <div className="h-56 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.weeklyPoints}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.8}
                    />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--foreground))",
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--foreground))",
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                      width={35}
                    />
                    <Tooltip content={<TodoTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      dot={{
                        r: 4.5,
                        fill: "#2563EB",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      activeDot={{ r: 6.5 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {locale === "zh" ? "加载趋势图表中..." : "Loading trend chart..."}
                </div>
              )}
            </div>

            {/* Todo Summary Metrics */}
            <div className="grid grid-cols-2 gap-2 border-t pt-2 text-xs">
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statTotalFinished}
                </span>
                <div className="text-base font-bold text-blue-700 dark:text-blue-300">
                  {data.summary.totalCompleted}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {locale === "zh" ? "项" : (data.summary.totalCompleted === 1 ? "task" : "tasks")}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {dict.statOverallRate}
                </span>
                <div className="text-base font-bold text-foreground">
                  {data.summary.completionRate}%
                </div>
              </div>
            </div>
          </div>
        )}

        <details className="rounded-lg border bg-muted/10 text-xs">
          <summary className="min-h-11 cursor-pointer px-3 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {dict.toggleTable}
          </summary>
          <div className="overflow-x-auto border-t">
            <table className="w-full min-w-[520px] text-left">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">{dict.tableColPeriod}</th>
                  <th className="px-3 py-2 font-medium">{dict.tableColRecordPlan}</th>
                  <th className="px-3 py-2 font-medium">{dict.tableColRate}</th>
                  <th className="px-3 py-2 font-medium">{dict.tableColOccurrences}</th>
                </tr>
              </thead>
              <tbody>
                {data.weeklyPoints.map((week) => (
                  <tr key={week.startDate} className="border-t">
                    <td className="px-3 py-2">
                      {formatLocalizedDateRange(week.startDate, week.endDate, locale)}
                    </td>
                    <td className="px-3 py-2">
                      {week.recordedDays} / {week.scheduledDays}
                    </td>
                    <td className="px-3 py-2">
                      {week.completionRate === null
                        ? "—"
                        : `${week.completionRate}%`}
                    </td>
                    <td className="px-3 py-2">
                      {week.occurrenceCount === null
                        ? dict.unrecordedLabel
                        : week.occurrenceCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
