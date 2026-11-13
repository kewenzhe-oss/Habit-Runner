import {
  getAnalyticsConfig,
  isLocalHostname,
  isValidGaId,
  isValidUuid,
  shouldEnableAnalytics,
} from "@/lib/config/analytics"

describe("PostSoma analytics config for habit_runner", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("treats PENDING and malformed GA IDs as disabled", () => {
    expect(isValidGaId("PENDING")).toBe(false)
    expect(isValidGaId("")).toBe(false)
    expect(isValidGaId("G-NZ2V582QTN")).toBe(true)
    expect(isValidUuid("c01f1c91-fac2-41cc-b0af-0148d52d2db7")).toBe(true)
    expect(isValidUuid("invalid-uuid")).toBe(false)
  })

  it("suppresses analytics on localhost and non-production builds", () => {
    expect(isLocalHostname("localhost")).toBe(true)
    expect(isLocalHostname("127.0.0.1")).toBe(true)
    expect(isLocalHostname("habits.dpdns.org")).toBe(false)
    expect(shouldEnableAnalytics("development", "habits.dpdns.org")).toBe(false)
    expect(shouldEnableAnalytics("production", "localhost")).toBe(false)
    expect(shouldEnableAnalytics("production", "habits.dpdns.org")).toBe(true)
  })

  it("defaults to Global Roll-up + Umami when project GA4 ID is PENDING", () => {
    process.env.NEXT_PUBLIC_GA_PROJECT_ID = "PENDING"
    const cfg = getAnalyticsConfig()
    expect(cfg.rollupGaId).toBe("G-NZ2V582QTN")
    expect(cfg.projectGaId).toBe("")
    expect(cfg.projectName).toBe("habit_runner")
    expect(cfg.cognitiveLayer).toBe("Utility")
    expect(cfg.umamiWebsiteId).toBe("c01f1c91-fac2-41cc-b0af-0148d52d2db7")
    expect(cfg.umamiScriptUrl).toBe(
      "https://pulse.postsoma-2050.website/pulse.js"
    )
    expect(cfg.crossDomains).toContain("habits.dpdns.org")
  })
})
