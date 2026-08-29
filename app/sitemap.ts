import { MetadataRoute } from "next"

import { toCanonicalUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: toCanonicalUrl("/"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: toCanonicalUrl("/about"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
