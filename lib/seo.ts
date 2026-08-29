import { Metadata } from "next"

import { PRIMARY_SITE_URL, siteConfig } from "@/config/site"

export const PRIVATE_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
}

export const SEARCH_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: true,
  googleBot: {
    index: false,
    follow: true,
  },
}

export function toCanonicalUrl(path = "/") {
  return new URL(path, `${PRIMARY_SITE_URL}/`).toString()
}

interface BuildPageMetadataOptions {
  title: string
  description: string
  path: string
  absoluteTitle?: boolean
  robots?: Metadata["robots"]
}

export function buildPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  robots,
}: BuildPageMetadataOptions): Metadata {
  const canonical = toCanonicalUrl(path)

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonical,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — energy-adaptive habit tracking`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteConfig.ogImage],
    },
    robots,
  }
}
