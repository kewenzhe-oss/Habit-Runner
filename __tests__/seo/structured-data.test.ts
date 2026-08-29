import {
  createAboutPageJsonLd,
  createOrganizationJsonLd,
  createWebApplicationJsonLd,
  createWebsiteJsonLd,
} from "@/lib/structured-data"
import { serializeJsonLd } from "@/components/seo/structured-data"

describe("structured data", () => {
  it("connects the organization, website, application, and about entities", () => {
    const graph = [
      createOrganizationJsonLd(),
      createWebsiteJsonLd(),
      createWebApplicationJsonLd(),
      createAboutPageJsonLd(),
    ]
    const serializedGraph = JSON.stringify(graph)

    expect(serializedGraph).toContain('"@type":"Organization"')
    expect(serializedGraph).toContain('"@type":"WebSite"')
    expect(serializedGraph).toContain('"@type":"WebApplication"')
    expect(serializedGraph).toContain('"@type":"AboutPage"')
    expect(serializedGraph).toContain("https://habits.dpdns.org/#organization")
    expect(serializedGraph).toContain("https://habits.dpdns.org/#website")
    expect(serializedGraph).not.toContain("habit-runner.vercel.app")
    expect(serializedGraph).not.toContain("habit-runner-2050.web.app")
  })

  it("backs SearchAction with the real public search URL", () => {
    expect(JSON.stringify(createWebsiteJsonLd())).toContain(
      "https://habits.dpdns.org/search?q={search_term_string}"
    )
  })

  it("does not invent ratings or reviews", () => {
    const application = JSON.stringify(createWebApplicationJsonLd())

    expect(application).not.toContain("aggregateRating")
    expect(application).not.toContain('"review"')
  })

  it("escapes script-breaking angle brackets", () => {
    const serialized = serializeJsonLd({ value: "</script><script>" })

    expect(serialized).toContain("\\u003c/script>")
    expect(serialized).not.toContain("</script>")
  })
})
