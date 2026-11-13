export const CROSS_DOMAIN_LIST = [
  "habits.dpdns.org",
  "postsoma-2050.website",
  "postsoma-2050.com",
  "readselah.org",
  "prayselah.org",
  "quantbrews.win",
  "recipelab.cc",
  "postsomabooks.qzz.io",
  "205011.xyz",
  "205022.xyz",
  "205033.xyz",
  "205044.xyz",
  "205055.xyz",
  "205077.xyz",
] as const

const DEFAULT_ROLLUP_GA_ID = "G-NZ2V582QTN"
const DEFAULT_PROJECT_GA_ID = "G-4GDXXMXR7V"
const DEFAULT_PROJECT_NAME = "habit_runner"
const DEFAULT_COGNITIVE_LAYER = "Utility"
const DEFAULT_UMAMI_WEBSITE_ID = "c01f1c91-fac2-41cc-b0af-0148d52d2db7"
const DEFAULT_UMAMI_SCRIPT_URL = "https://pulse.postsoma-2050.website/pulse.js"

export function isValidGaId(id: string | undefined | null): id is string {
  return typeof id === "string" && /^G-[A-Z0-9]+$/i.test(id.trim())
}

export function isValidUuid(id: string | undefined | null): id is string {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id.trim()
    )
  )
}

export function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase()
  if (!normalized) return true
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".local")
  )
}

export function shouldEnableAnalytics(
  nodeEnv: string | undefined,
  hostname: string
): boolean {
  return nodeEnv === "production" && !isLocalHostname(hostname)
}

export function getAnalyticsConfig() {
  const rollupGaId =
    process.env.NEXT_PUBLIC_GA_ROLLUP_ID?.trim() || DEFAULT_ROLLUP_GA_ID
  const rawProjectGaId =
    process.env.NEXT_PUBLIC_GA_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GA_ID?.trim() ||
    DEFAULT_PROJECT_GA_ID
  const projectName =
    process.env.NEXT_PUBLIC_GA_PROJECT_NAME?.trim() || DEFAULT_PROJECT_NAME
  const cognitiveLayer =
    process.env.NEXT_PUBLIC_GA_COGNITIVE_LAYER?.trim() ||
    DEFAULT_COGNITIVE_LAYER
  const umamiWebsiteId =
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() || DEFAULT_UMAMI_WEBSITE_ID
  const umamiScriptUrl =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim() || DEFAULT_UMAMI_SCRIPT_URL

  return {
    rollupGaId: isValidGaId(rollupGaId) ? rollupGaId : "",
    projectGaId: isValidGaId(rawProjectGaId) ? rawProjectGaId : "",
    projectName,
    cognitiveLayer,
    umamiWebsiteId: isValidUuid(umamiWebsiteId) ? umamiWebsiteId : "",
    umamiScriptUrl,
    crossDomains: [...CROSS_DOMAIN_LIST],
  }
}
