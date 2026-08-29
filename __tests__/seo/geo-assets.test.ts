import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { searchPublicKnowledge } from "@/lib/public-knowledge"

function readProjectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8")
}

describe("GEO machine resources", () => {
  it("provides a concise machine index in the proposed llms.txt shape", () => {
    const feed = readProjectFile("public/llms.txt")

    expect(feed).toMatch(/^# Habit Runner\n\n> /)
    expect(feed).toContain("## Start here")
    expect(feed).toContain("https://habits.dpdns.org/about")
    expect(feed).toContain("https://habits.dpdns.org/llms-full.txt")
  })

  it("provides factual full context and explicit privacy boundaries", () => {
    const feed = readProjectFile("public/llms-full.txt")

    expect(feed).toContain("## Four energy states")
    expect(feed).toContain("## Seven life layers")
    expect(feed).toContain("## Public and private information boundaries")
    expect(feed).toContain("## Citation guide")
    expect(feed).not.toContain("habit-runner.vercel.app")
    expect(feed).not.toContain("habit-runner-2050.web.app")
  })

  it("searches only the static public knowledge catalog", () => {
    expect(
      searchPublicKnowledge("energy rest").map((entry) => entry.title)
    ).toContain("Energy-adaptive action rhythm")
    expect(
      searchPublicKnowledge("private account").map((entry) => entry.title)
    ).toContain("Privacy and scope boundaries")
    expect(searchPublicKnowledge("unmatched phrase")).toEqual([])
  })
})
