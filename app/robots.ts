import { MetadataRoute } from "next"

import { PRIMARY_SITE_URL } from "@/config/site"

export const AI_CRAWLERS = [
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "Applebot-Extended",
  "Google-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "Diffbot",
] as const

export const PRIVATE_CRAWL_PATHS = [
  "/api",
  "/dashboard",
  "/items",
  "/insights",
  "/settings",
  "/today",
  "/signin",
  "/signup",
] as const

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [...AI_CRAWLERS],
        allow: ["/", "/about", "/search", "/llms.txt", "/llms-full.txt"],
        disallow: [...PRIVATE_CRAWL_PATHS],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PRIVATE_CRAWL_PATHS],
      },
    ],
    host: PRIMARY_SITE_URL,
    sitemap: `${PRIMARY_SITE_URL}/sitemap.xml`,
  }
}
