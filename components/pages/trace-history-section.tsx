import { getDictionary } from "@/lib/i18n"
import { cn } from "@/lib/utils"

// Static product illustration; not user statistics.
const weeks = [
  [1, 1, 2, 1, 1, 0, 1],
  [1, 0, 1, 1, 2, 1, 1],
  [1, 1, 1, 0, 1, 2, 1],
  [1, 2, 1, 1, 0, 0, 0],
]
const weekdays = ["一", "二", "三", "四", "五", "六", "日"]

export default function TraceHistorySection() {
  const dict = getDictionary("zh").landing.trace
  return (
    <section
      id="trace-history"
      aria-labelledby="trace-title"
      className="border-t px-4 py-14 sm:px-6 sm:py-20"
    >
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-16">
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground">
            {dict.sectionBadge}
          </p>
          <h2
            id="trace-title"
            className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl"
          >
            {dict.sectionTitle}
          </h2>
          <p className="max-w-md text-base leading-7 text-muted-foreground">
            {dict.sectionSubtext}
          </p>
        </div>
        <figure className="min-w-0 rounded-xl border bg-card p-5 sm:p-6">
          <figcaption className="mb-5 space-y-1">
            <h3 className="text-sm font-medium">{dict.matrixTitle}</h3>
            <p className="text-xs leading-5 text-muted-foreground">
              {dict.matrixSubtitle}
            </p>
          </figcaption>
          <div
            role="img"
            aria-label={dict.matrixAria}
            className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] items-center gap-2 text-center sm:gap-3"
          >
            <span aria-hidden="true" />
            {weekdays.map((day) => (
              <span
                aria-hidden="true"
                key={day}
                className="text-xs text-muted-foreground"
              >
                {day}
              </span>
            ))}
            {weeks.map((week, index) => (
              <div key={index} className="contents" aria-hidden="true">
                <span className="text-xs tabular-nums text-muted-foreground">
                  0{index + 1}
                </span>
                {week.map((status, day) => (
                  <span
                    key={day}
                    className={cn(
                      "mx-auto aspect-square w-full max-w-8 rounded-sm",
                      status === 1
                        ? "bg-foreground/75"
                        : status === 2
                          ? "border border-foreground/40 bg-background"
                          : "bg-muted"
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm bg-foreground/75"
              />
              {dict.legendDone}
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm border border-foreground/40"
              />
              {dict.legendRest}
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm bg-muted"
              />
              {dict.legendEmpty}
            </span>
          </div>
        </figure>
      </div>
    </section>
  )
}
