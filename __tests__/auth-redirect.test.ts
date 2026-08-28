import {
  buildSignInUrl,
  buildSignUpUrl,
  getSafeRedirectPath,
  resolvePostSignInPath,
} from "@/lib/auth-redirect"

describe("auth redirect helpers", () => {
  it("builds one encoded sign-in path for dashboard and item restoration", () => {
    expect(buildSignInUrl()).toBe("/signin?redirect=%2Fdashboard")
    expect(buildSignInUrl("/items/new?restore=1")).toBe(
      "/signin?redirect=%2Fitems%2Fnew%3Frestore%3D1"
    )
    expect(buildSignUpUrl("/items/new?restore=1")).toBe(
      "/signup?redirect=%2Fitems%2Fnew%3Frestore%3D1"
    )
  })

  it("rejects external and protocol-relative redirect targets", () => {
    expect(getSafeRedirectPath("https://example.com")).toBe("/dashboard")
    expect(getSafeRedirectPath("//example.com/path")).toBe("/dashboard")
    expect(getSafeRedirectPath("/items/new?restore=1")).toBe(
      "/items/new?restore=1"
    )
  })

  it("supports the explicit restore query used by the sign-in page", () => {
    expect(
      resolvePostSignInPath({ redirect: "/items/new", restore: "1" })
    ).toBe("/items/new?restore=1")
  })
})
