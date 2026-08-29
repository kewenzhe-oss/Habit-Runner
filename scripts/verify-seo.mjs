import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = process.cwd()
const canonicalOrigin = "https://habits.dpdns.org"
const obsoleteOrigins = [
  "https://habit-runner.vercel.app",
  "https://habit-runner-2050.web.app",
]

const requiredFiles = [
  ".agents/skills/geo-seo-optimization/SKILL.md",
  "app/robots.ts",
  "app/sitemap.ts",
  "app/(frontpage)/about/page.tsx",
  "app/(frontpage)/search/page.tsx",
  "components/seo/structured-data.tsx",
  "lib/seo.ts",
  "lib/structured-data.ts",
  "public/llms.txt",
  "public/llms-full.txt",
]

const requiredBots = [
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
]

function read(path) {
  return readFileSync(resolve(root, path), "utf8")
}

function check(condition, message) {
  if (!condition) throw new Error(message)
  process.stdout.write(`PASS ${message}\n`)
}

for (const file of requiredFiles) {
  check(Boolean(read(file)), `${file} exists and is not empty`)
}

const robotsSource = read("app/robots.ts")
for (const bot of requiredBots) {
  check(robotsSource.includes(`"${bot}"`), `robots policy includes ${bot}`)
}

const conciseFeed = read("public/llms.txt")
const fullFeed = read("public/llms-full.txt")
const seoSurfaces = [
  read("config/site.ts"),
  read("lib/seo.ts"),
  read("lib/structured-data.ts"),
  read("app/sitemap.ts"),
  conciseFeed,
  fullFeed,
  read("apphosting.yaml"),
].join("\n")

check(
  conciseFeed.startsWith("# Habit Runner\n\n> "),
  "llms.txt has the required title and summary"
)
check(conciseFeed.includes("## Start here"), "llms.txt provides a start index")
check(
  fullFeed.includes("## Public and private information boundaries"),
  "llms-full.txt declares privacy boundaries"
)
check(
  fullFeed.includes("## Citation guide"),
  "llms-full.txt provides citation guidance"
)
check(
  seoSurfaces.includes(canonicalOrigin),
  "SEO surfaces use the canonical origin"
)

for (const origin of obsoleteOrigins) {
  check(!seoSurfaces.includes(origin), `SEO surfaces exclude ${origin}`)
}

const structuredData = read("lib/structured-data.ts")
check(
  structuredData.includes('"@type": "Organization"'),
  "Organization JSON-LD is defined"
)
check(
  structuredData.includes('"@type": "WebSite"'),
  "WebSite JSON-LD is defined"
)
check(
  structuredData.includes('"@type": "WebApplication"'),
  "WebApplication JSON-LD is defined"
)
check(
  !structuredData.includes("aggregateRating"),
  "structured data does not fabricate aggregate ratings"
)
check(
  !structuredData.includes('"review"'),
  "structured data does not fabricate reviews"
)

process.stdout.write("SEO/GEO source validation passed.\n")
