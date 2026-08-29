import { PRIMARY_SITE_URL, siteConfig } from "@/config/site"
import {
  buildPageMetadata,
  PRIVATE_ROBOTS,
  SEARCH_ROBOTS,
  toCanonicalUrl,
} from "@/lib/seo"
import robots, { AI_CRAWLERS, PRIVATE_CRAWL_PATHS } from "@/app/robots"
import sitemap from "@/app/sitemap"

describe("SEO configuration", () => {
  it("uses one stable canonical origin", () => {
    expect(PRIMARY_SITE_URL).toBe("https://habits.dpdns.org")
    expect(siteConfig.url.base).toBe(PRIMARY_SITE_URL)
    expect(siteConfig.ogImage).toBe(`${PRIMARY_SITE_URL}/og.jpg`)
    expect(toCanonicalUrl("/about")).toBe(`${PRIMARY_SITE_URL}/about`)
  })

  it("builds self-canonical public metadata", () => {
    const metadata = buildPageMetadata({
      title: "About Habit Runner",
      description: "A public description",
      path: "/about",
    })

    expect(metadata.alternates?.canonical).toBe(`${PRIMARY_SITE_URL}/about`)
    expect(metadata.openGraph?.url).toBe(`${PRIMARY_SITE_URL}/about`)
    expect(metadata.robots).toBeUndefined()
  })

  it("keeps private pages and search results out of the index", () => {
    expect(PRIVATE_ROBOTS).toMatchObject({ index: false, follow: false })
    expect(SEARCH_ROBOTS).toMatchObject({ index: false, follow: true })
  })

  it("explicitly identifies AI crawlers without opening private routes", () => {
    const policy = robots()
    const serializedPolicy = JSON.stringify(policy)

    for (const crawler of AI_CRAWLERS) {
      expect(serializedPolicy).toContain(crawler)
    }

    for (const path of PRIVATE_CRAWL_PATHS) {
      expect(serializedPolicy).toContain(path)
    }

    expect(policy.host).toBe(PRIMARY_SITE_URL)
    expect(policy.sitemap).toBe(`${PRIMARY_SITE_URL}/sitemap.xml`)
  })

  it("only publishes canonical, indexable HTML pages in the sitemap", () => {
    const entries = sitemap()

    expect(entries.map((entry) => entry.url)).toEqual([
      `${PRIMARY_SITE_URL}/`,
      `${PRIMARY_SITE_URL}/about`,
    ])
    expect(
      entries.every((entry) => entry.url.startsWith(PRIMARY_SITE_URL))
    ).toBe(true)
  })
})
