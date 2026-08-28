import { getDictionary } from "@/lib/i18n"
import { Icons } from "@/components/icons"

export default function AdaptiveRhythmSection() {
  const dict = getDictionary("zh").landing.adaptive

  return (
    <section className="border-t border-border/40 bg-muted/20 py-16 lg:py-24" id="adaptive-rhythm">
      <div className="container space-y-12">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <div className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {dict.sectionBadge}
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
            {dict.sectionTitle}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {dict.sectionSubtext}
          </p>
        </div>

        {/* Visual 2: Adaptive 4-Tier Energy Decision Canvas */}
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xl shadow-black/5 md:p-8">
            {/* Header: Example Action */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  自适应行动示例 · Adaptive Routine
                </span>
                <h3 className="text-base font-bold text-foreground sm:text-lg">
                  每日深度阅读
                </h3>
              </div>
              <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                4 阶能量自适应
              </span>
            </div>

            {/* 4-Tier Adaptive Cards Ladder */}
            <div className="space-y-3">
              {/* Tier 1: High Energy */}
              <div className="flex flex-col justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 transition-all hover:border-emerald-500/60 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ⚡
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {dict.tierHighTitle}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {dict.tierHighDesc}
                    </p>
                  </div>
                </div>
                <span className="self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 sm:self-auto">
                  {dict.tierHighBadge}
                </span>
              </div>

              {/* Tier 2: Normal */}
              <div className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-border sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                    🌱
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {dict.tierNormalTitle}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {dict.tierNormalDesc}
                    </p>
                  </div>
                </div>
                <span className="self-start rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:self-auto">
                  {dict.tierNormalBadge}
                </span>
              </div>

              {/* Tier 3: Low Energy · Micro-Action (Highlight Core Difference) */}
              <div className="flex flex-col justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 ring-1 ring-amber-500/20 transition-all hover:border-amber-500/70 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-600 dark:text-amber-400">
                    ✨
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {dict.tierLowTitle}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dict.tierLowDesc}
                    </p>
                  </div>
                </div>
                <span className="self-start rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 sm:self-auto">
                  {dict.tierLowBadge}
                </span>
              </div>

              {/* Tier 4: Conscious Rest */}
              <div className="flex flex-col justify-between gap-2 rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 transition-all hover:border-purple-500/60 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-xs font-bold text-purple-600 dark:text-purple-400">
                    ☕
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {dict.tierRestTitle}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {dict.tierRestDesc}
                    </p>
                  </div>
                </div>
                <span className="self-start rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 dark:text-purple-300 sm:self-auto">
                  {dict.tierRestBadge}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
