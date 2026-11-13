import { MetadataRoute } from "next"

import { toCanonicalUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-13T00:00:00.000Z")

  return [
    {
      url: toCanonicalUrl("/"),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: toCanonicalUrl("/about"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
