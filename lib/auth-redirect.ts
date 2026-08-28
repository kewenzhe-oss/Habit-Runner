export const DEFAULT_POST_SIGN_IN_PATH = "/dashboard"

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_POST_SIGN_IN_PATH
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback
  }

  try {
    const parsed = new URL(value, "https://habit-runner.local")
    if (parsed.origin !== "https://habit-runner.local") return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export function buildSignInUrl(
  redirectPath = DEFAULT_POST_SIGN_IN_PATH
): string {
  const safePath = getSafeRedirectPath(redirectPath)
  return `/signin?redirect=${encodeURIComponent(safePath)}`
}

export function buildSignUpUrl(
  redirectPath = DEFAULT_POST_SIGN_IN_PATH
): string {
  const safePath = getSafeRedirectPath(redirectPath)
  return `/signup?redirect=${encodeURIComponent(safePath)}`
}

export function resolvePostSignInPath(params: {
  redirect?: string | null
  restore?: string | null
}): string {
  const path = getSafeRedirectPath(params.redirect)
  if (params.restore === "1" && path === "/items/new") {
    return "/items/new?restore=1"
  }
  return path
}
