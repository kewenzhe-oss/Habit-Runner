import Link from "next/link"

import { buildSignInUrl } from "@/lib/auth-redirect"
import { getDictionary } from "@/lib/i18n"
import { Icons } from "@/components/icons"

interface HeroHeaderProps {
  isAuthenticated: boolean
}

export default function HeroHeader({ isAuthenticated }: HeroHeaderProps) {
  const dict = getDictionary("zh").landing.hero
  const examples = [
    { title: "读书", action: "读了 20 分钟", status: "已完成" },
    { title: "晚间散步", action: "今天走 5 分钟", status: "微行动" },
    { title: "睡前不刷短视频", action: "今天做到了", status: "已记录" },
  ]

  return (
    <section
      aria-labelledby="landing-title"
      className="px-4 py-14 sm:px-6 sm:py-20 lg:py-24"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="min-w-0 space-y-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            {dict.eyebrow}
          </p>
          <h1
            id="landing-title"
            className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {dict.title}
          </h1>
          <p className="max-w-md text-base leading-7 text-muted-foreground">
            {dict.subtitle}
          </p>
          <Link
            href={isAuthenticated ? "/dashboard" : buildSignInUrl("/dashboard")}
            className="inline-flex min-h-11 items-center justify-center gap-3 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {dict.ctaPrimary}
            <Icons.next aria-hidden="true" className="h-4 w-4" />
          </Link>
          <p className="text-xs leading-5 text-muted-foreground">{dict.note}</p>
        </div>

        <figure className="min-w-0 rounded-xl border bg-card">
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {dict.previewTitle}
            </span>
            <span>{dict.previewLabel}</span>
          </figcaption>
          <div className="px-5 py-5 sm:px-6">
            <p className="text-lg font-semibold text-foreground">
              {dict.previewHeading}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {dict.previewDescription}
            </p>
            <ul className="mt-5 divide-y">
              {examples.map((example) => (
                <li
                  key={example.title}
                  className="flex items-start justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {example.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {example.action}
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                    {example.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </figure>
      </div>
    </section>
  )
}
