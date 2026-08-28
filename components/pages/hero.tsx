import Link from "next/link"
import { cn } from "@/lib/utils"
import { getDictionary } from "@/lib/i18n"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export default function HeroHeader() {
  const dict = getDictionary("zh").landing.hero

  return (
    <section className="space-y-8 pb-12 pt-8 md:space-y-12 md:pt-14 lg:py-20">
      {/* 1. Header Typography */}
      <div className="container flex max-w-[58rem] flex-col items-center gap-3 text-center">
        {/* 眉题 (Eyebrow) */}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          {dict.eyebrow}
        </p>

        {/* 主标题 (Headline) */}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
          {dict.title}
        </h1>

        {/* 副标题 (Subtitle) */}
        <p className="max-w-[36rem] text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
          {dict.subtitle}
        </p>

        {/* CTA 按钮 */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 shadow-xs")}
          >
            <span>{dict.ctaPrimary}</span>
            <Icons.next className="h-4 w-4" />
          </Link>
          <Link
            href="/signin"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {dict.ctaSecondary}
          </Link>
        </div>
      </div>

      {/* 2. Hero Visual 1: Today Compass & Action Surface (Centered Floating Mockup) */}
      <div className="container max-w-4xl px-4 sm:px-6">
        <div className="relative rounded-2xl border border-border/80 bg-linear-to-b from-card to-card/95 p-4 shadow-2xl shadow-black/5 ring-1 ring-border/40 md:p-6">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />

          {/* ——— Today Compass Card ——— */}
          <div className="relative space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <Icons.check className="h-3 w-3" />
                <span>✓ 今日日常已达成 · 4/4</span>
              </span>
              <span className="text-[11px] text-muted-foreground/75">本周还剩 3 天</span>
            </div>

            <div className="space-y-0.5">
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                今天的日常已全部完成
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                今天的节律已稳稳达成，享受放松时间。
              </p>
            </div>

            {/* Inline Energy Selector Pill Row */}
            <div className="flex items-center gap-1.5 border-t border-border/40 pt-2.5">
              <span className="mr-1 text-[11px] text-muted-foreground/60">今日能量状态</span>
              <span className="rounded-full border border-foreground bg-foreground px-2.5 py-0.5 text-[11px] font-medium text-background">
                High
              </span>
              <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Normal
              </span>
              <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Low
              </span>
              <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Rest
              </span>
            </div>
          </div>

          {/* ——— Category Filter Pills ——— */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-foreground bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background">
              全部
            </span>
            <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>身体与健康</span>
            </span>
            <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>创造与工作</span>
            </span>
            <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span>学习与输入</span>
            </span>
            <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>深度思考</span>
            </span>
          </div>

          {/* ——— Action Stream (Quiet Minimal Divider List) ——— */}
          <div className="mt-3 divide-y divide-border/40 rounded-xl border border-border/50 bg-card px-4">
            {/* Item 1 */}
            <div className="flex items-center gap-3 py-3">
              <span className="h-6 w-0.5 shrink-0 rounded-full bg-purple-500 opacity-80" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">每日深度阅读</span>
                  <span className="text-[11px] text-muted-foreground/60">12天</span>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/50">
                  <span className="flex flex-col items-center gap-0.5"><span>一</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>二</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>三</span><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>四</span><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>五</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 font-bold text-primary" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>六</span><span className="h-1.5 w-1.5 rounded-full border border-dashed border-muted-foreground/20" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>日</span><span className="h-1.5 w-1.5 rounded-full border border-dashed border-muted-foreground/20" /></span>
                </div>
              </div>
              <span className="h-4 w-4 shrink-0 rounded-full bg-purple-500" />
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-3 py-3">
              <span className="h-6 w-0.5 shrink-0 rounded-full bg-emerald-500 opacity-80" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">力量与体态恢复训练</span>
                  <span className="text-[11px] text-muted-foreground/60">8天</span>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/50">
                  <span className="flex flex-col items-center gap-0.5"><span>一</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>二</span><span className="h-1.5 w-1.5 rounded-full border border-dashed border-muted-foreground/20" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>三</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>四</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>五</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 font-bold text-primary" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>六</span><span className="h-1.5 w-1.5 rounded-full border border-dashed border-muted-foreground/20" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>日</span><span className="h-1.5 w-1.5 rounded-full border border-dashed border-muted-foreground/20" /></span>
                </div>
              </div>
              <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500" />
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-3 py-3">
              <span className="h-6 w-0.5 shrink-0 rounded-full bg-blue-500 opacity-80" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">自由书写 post</span>
                  <span className="text-[11px] text-muted-foreground/60">5天</span>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/50">
                  <span className="flex flex-col items-center gap-0.5"><span>一</span><span className="h-1.5 w-1.5 rounded-full border border-dashed border-muted-foreground/20" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>二</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>三</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>四</span><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>五</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 font-bold text-primary" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>六</span><span className="h-1.5 w-1.5 rounded-full border border-dashed border-muted-foreground/20" /></span>
                  <span className="flex flex-col items-center gap-0.5"><span>日</span><span className="h-1.5 w-1.5 rounded-full border border-dashed border-muted-foreground/20" /></span>
                </div>
              </div>
              <span className="h-4 w-4 shrink-0 rounded-full bg-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
