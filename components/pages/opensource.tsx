import Link from "next/link"

import { siteConfig } from "@/config/site"
import { getDictionary } from "@/lib/i18n"
import { Icons } from "@/components/icons"

export default function OpenSource() {
  const dict = getDictionary("zh").landing.openSource
  return (
    <section
      aria-labelledby="opensource-title"
      className="border-t px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="mx-auto flex max-w-5xl flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h2 id="opensource-title" className="text-lg font-semibold">
            {dict.title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {dict.subtext}
          </p>
        </div>
        <Link
          href={siteConfig.links.github}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:self-auto"
        >
          {dict.githubButton}
          <Icons.next aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
