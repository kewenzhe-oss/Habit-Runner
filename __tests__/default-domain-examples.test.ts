import {
  DEFAULT_DOMAIN_EXAMPLES,
  getDefaultDomainExample,
} from "@/lib/defaultDomainExamples"

describe("default domain examples", () => {
  it("defines exactly one HTTPS example for every life layer", () => {
    expect(DEFAULT_DOMAIN_EXAMPLES).toEqual({
      BODY: "https://postsoma-2050.website/",
      CRAFT: "https://www.205022.xyz/",
      SIGNAL: "https://postsomabooks.qzz.io/",
      MEMORY: "https://postsoma-2050.website/",
      JUDGMENT: "https://www.quantbrews.win/",
      CONTEMPLATION: "https://www.readselah.org/",
      LIFE: "https://205077.xyz/",
    })
    expect(Object.values(DEFAULT_DOMAIN_EXAMPLES)).toHaveLength(7)
    expect(
      Object.values(DEFAULT_DOMAIN_EXAMPLES).every((url) =>
        url.startsWith("https://")
      )
    ).toBe(true)
  })

  it("returns the one configured example for a selected layer", () => {
    expect(getDefaultDomainExample("SIGNAL")).toBe(
      "https://postsomabooks.qzz.io/"
    )
  })
})
