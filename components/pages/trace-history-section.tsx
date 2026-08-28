import { getDictionary } from "@/lib/i18n"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

export default function TraceHistorySection() {
  const dict = getDictionary("zh").landing.trace

  // Mock 28 days (4 natural weeks) rich with realistic progress
  // Week 1 (3w ago): 5 completed (2 high, 2 normal, 1 low), 1 rest, 1 none
  // Week 2 (2w ago): 6 completed (3 high, 2 normal, 1 low), 1 none
  // Week 3 (last week): 5 completed (2 high, 2 normal, 1 low), 1 rest, 1 none
  // Week 4 (this week): 5 completed (3 high, 1 normal, 1 low), 2 upcoming
  const mockMatrix = [
    // Mon - Sun (Week 1, 3w ago)
    { day: "一", status: "HIGH" },
    { day: "二", status: "NORMAL" },
    { day: "三", status: "REST" },
    { day: "四", status: "LOW" },
    { day: "五", status: "HIGH" },
    { day: "六", status: "NORMAL" },
    { day: "日", status: "NONE" },

    // Mon - Sun (Week 2, 2w ago)
    { day: "一", status: "HIGH" },
    { day: "二", status: "NORMAL" },
    { day: "三", status: "HIGH" },
    { day: "四", status: "LOW" },
    { day: "五", status: "HIGH" },
    { day: "六", status: "NORMAL" },
    { day: "日", status: "NORMAL" },

    // Mon - Sun (Week 3, last week)
    { day: "一", status: "NORMAL" },
    { day: "二", status: "HIGH" },
    { day: "三", status: "REST" },
    { day: "四", status: "LOW" },
    { day: "五", status: "HIGH" },
    { day: "六", status: "NORMAL" },
    { day: "日", status: "NONE" },

    // Mon - Sun (Week 4, this week)
    { day: "一", status: "HIGH" },
    { day: "二", status: "HIGH" },
    { day: "三", status: "LOW" },
    { day: "四", status: "NORMAL" },
    { day: "五", status: "HIGH", isToday: true },
    { day: "六", status: "UPCOMING" },
    { day: "日", status: "UPCOMING" },
  ]

  const weekHeaders = ["3周前", "2周前", "上周", "本周"]

  const getDotStyle = (status: string, isToday?: boolean) => {
    if (status === "HIGH") {
      return "bg-emerald-600 dark:bg-emerald-500 ring-1 ring-emerald-500/40"
    }
    if (status === "NORMAL") {
      return "bg-emerald-500 dark:bg-emerald-400 ring-1 ring-emerald-500/30"
    }
    if (status === "LOW") {
      return "bg-amber-500 dark:bg-amber-400 ring-1 ring-amber-500/40"
    }
    if (status === "REST") {
      return "bg-purple-500 dark:bg-purple-400 ring-1 ring-purple-500/30"
    }
    if (isToday) {
      return "border border-dashed border-primary/70 bg-primary/10 animate-pulse"
    }
    if (status === "UPCOMING") {
      return "border border-dashed border-muted-foreground/20 bg-transparent"
    }
    return "bg-muted/50 border border-border/40"
  }

  return (
    <section className="border-t border-border/40 py-16 lg:py-24" id="trace-history">
      <div className="container space-y-12">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            {dict.sectionBadge}
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
            {dict.sectionTitle}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {dict.sectionSubtext}
          </p>
        </div>

        {/* Visual 3: Rich History Matrix & Stats Artifact */}
        <div className="mx-auto max-w-3xl space-y-4">
          {/* 3-Column Quiet Stats Bar */}
          <div className="grid grid-cols-3 divide-x divide-border/40 rounded-xl border border-border/60 bg-card p-2 shadow-sm">
            <div className="flex flex-col items-center justify-center p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
              <Icons.check className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 sm:block" />
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {dict.stat1Label}
                </p>
                <div className="flex items-baseline justify-center gap-1 sm:justify-start">
                  <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {dict.stat1Value}
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground/70">
                    {dict.stat1Unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
              <Icons.calendar className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 sm:block" />
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {dict.stat2Label}
                </p>
                <div className="flex items-baseline justify-center gap-1 sm:justify-start">
                  <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {dict.stat2Value}
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground/70">
                    {dict.stat2Unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
              <Icons.fire className="hidden h-4 w-4 shrink-0 text-amber-500/70 sm:block" />
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {dict.stat3Label}
                </p>
                <div className="flex items-baseline justify-center gap-1 sm:justify-start">
                  <span className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 sm:text-2xl">
                    {dict.stat3Value}
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground/70">
                    {dict.stat3Unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Week Matrix Surface */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl shadow-black/5 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Icons.calendar className="h-4 w-4 text-muted-foreground/60" />
                  <h3 className="text-base font-bold text-foreground sm:text-lg">
                    {dict.matrixTitle}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dict.matrixSubtitle}
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-emerald-600" />
                  <span>充沛</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-emerald-500" />
                  <span>日常</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-amber-500" />
                  <span>微行动</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-purple-500" />
                  <span>休整</span>
                </div>
              </div>
            </div>

            {/* Matrix Columns (4 Weeks x 7 Days Grid) */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {weekHeaders.map((header, colIdx) => (
                <div key={header} className="space-y-2 rounded-xl bg-muted/20 p-3 text-center">
                  <span className="text-[11px] font-semibold text-muted-foreground/80">
                    {header}
                  </span>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((rowIdx) => {
                      const item = mockMatrix[colIdx * 7 + rowIdx]
                      if (!item) return null
                      return (
                        <div
                          key={rowIdx}
                          className="flex items-center justify-between px-1 text-xs"
                        >
                          <span className="text-[10px] text-muted-foreground/60">
                            {["一", "二", "三", "四", "五", "六", "日"][rowIdx]}
                          </span>
                          <span
                            className={cn(
                              "h-3.5 w-3.5 rounded-xs transition-transform hover:scale-125",
                              getDotStyle(item.status, item.isToday)
                            )}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
