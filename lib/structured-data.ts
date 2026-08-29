import { siteConfig } from "@/config/site"
import { toCanonicalUrl } from "@/lib/seo"

export type JsonLd = Record<string, unknown>

const ORGANIZATION_ID = toCanonicalUrl("/#organization")
const WEBSITE_ID = toCanonicalUrl("/#website")

export function createOrganizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    url: siteConfig.url.base,
    logo: {
      "@type": "ImageObject",
      url: toCanonicalUrl("/pwa-target-512-20260828.png"),
      width: 512,
      height: 512,
    },
    description: siteConfig.description,
    sameAs: [siteConfig.links.github],
    knowsAbout: [
      "energy-adaptive habit tracking",
      "behavioral consistency",
      "conscious rest",
      "longitudinal action reflection",
    ],
  }
}

export function createWebsiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url.base,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: toCanonicalUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function createWebApplicationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": toCanonicalUrl("/#application"),
    name: siteConfig.name,
    url: siteConfig.url.base,
    description: siteConfig.description,
    applicationCategory: "LifestyleApplication",
    applicationSubCategory: "Habit Tracking",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    screenshot: toCanonicalUrl("/images/dashboard.jpg"),
    featureList: [
      "Energy-adaptive High, Normal, Low, and Rest action levels",
      "Habit, reduction behavior, and task tracking",
      "Seven life-layer organization system",
      "Longitudinal action history and rhythm reflection",
    ],
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
  }
}

export function createAboutPageJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": toCanonicalUrl("/about#webpage"),
    url: toCanonicalUrl("/about"),
    name: `About ${siteConfig.name}`,
    description:
      "Habit Runner's mission, behavior-based methodology, privacy boundaries, open-source identity, and citation guidance.",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": toCanonicalUrl("/#application") },
    mainEntity: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
  }
}

export function createBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toCanonicalUrl(item.path),
    })),
  }
}

export function createSearchResultsPageJsonLd(query: string): JsonLd {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : ""

  return {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "@id": toCanonicalUrl(`/search${suffix}#webpage`),
    url: toCanonicalUrl(`/search${suffix}`),
    name: query
      ? `Search results for “${query}” — ${siteConfig.name}`
      : `Search public knowledge — ${siteConfig.name}`,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "en",
  }
}
