import { Metadata } from "next"
import Link from "next/link"

import { PUBLIC_KNOWLEDGE, searchPublicKnowledge } from "@/lib/public-knowledge"
import { buildPageMetadata, SEARCH_ROBOTS } from "@/lib/seo"
import { createSearchResultsPageJsonLd } from "@/lib/structured-data"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { StructuredData } from "@/components/seo/structured-data"

export const metadata: Metadata = buildPageMetadata({
  title: "Search Habit Runner's public knowledge",
  description:
    "Search Habit Runner's public product model, methodology, privacy boundaries, and citation guidance.",
  path: "/search",
  robots: SEARCH_ROBOTS,
})

interface SearchPageProps {
  searchParams?: Promise<{ q?: string | string[] }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {}
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q
  const query = rawQuery?.trim().slice(0, 120) || ""
  const results = searchPublicKnowledge(query)

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-10 sm:px-6 md:pt-14"
    >
      <StructuredData
        id="habit-runner-search-results"
        data={createSearchResultsPageJsonLd(query)}
      />

      <section className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Public knowledge
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Search Habit Runner
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Search public product concepts, methodology, privacy boundaries, and
          citation guidance. Private accounts and action records are never part
          of this index.
        </p>
      </section>

      <form
        action="/search"
        method="get"
        role="search"
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <div className="flex-1">
          <label
            htmlFor="public-knowledge-query"
            className="mb-2 block text-sm font-semibold"
          >
            Search terms
          </label>
          <Input
            id="public-knowledge-query"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Try energy, rest, growth, privacy…"
            maxLength={120}
            className="h-11"
          />
        </div>
        <Button type="submit" className="mt-auto gap-2">
          <Icons.globe className="h-4 w-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      <section
        aria-live="polite"
        aria-labelledby="results-title"
        className="mt-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-4">
          <h2 id="results-title" className="text-xl font-bold">
            {query ? `Results for “${query}”` : "Browse all topics"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {results.length} of {PUBLIC_KNOWLEDGE.length} topics
          </p>
        </div>

        {results.length > 0 ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {results.map((result) => (
              <li key={result.title}>
                <Card className="h-full p-5 transition-colors hover:border-foreground/30">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {result.category}
                  </p>
                  <h3 className="mt-2 text-lg font-bold leading-6">
                    <Link
                      href={result.href}
                      className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {result.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {result.summary}
                  </p>
                  <Link
                    href={result.href}
                    aria-label={`Read ${result.title}`}
                    className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"
                  >
                    Read source
                    <Icons.next className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed p-8 text-center">
            <h3 className="font-semibold">No public topic matched yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a broader term such as “energy”, “growth”, “habit”, or
              “privacy”.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
