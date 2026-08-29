export interface PublicKnowledgeEntry {
  title: string
  summary: string
  href: string
  category: string
  keywords: string[]
}

export const PUBLIC_KNOWLEDGE: PublicKnowledgeEntry[] = [
  {
    title: "Energy-adaptive action rhythm",
    summary:
      "High, Normal, Low, and Rest let an action respond to the energy available today without turning a smaller action or conscious recovery into failure.",
    href: "/#adaptive-rhythm",
    category: "Product model",
    keywords: [
      "energy",
      "high",
      "normal",
      "low",
      "rest",
      "micro action",
      "adaptive rhythm",
    ],
  },
  {
    title: "Habit, reduction behavior, and task models",
    summary:
      "Habit Runner keeps recurring habits, behaviors being reduced, and finite tasks distinct so each can use an appropriate recording model.",
    href: "/about#product-model",
    category: "Product model",
    keywords: ["habit", "quit habit", "reduction", "behavior", "task", "todo"],
  },
  {
    title: "Seven life layers",
    summary:
      "Body, Craft, Signal, Memory, Judgment, Contemplation, and Life organize where actions accumulate without claiming that every life should look perfectly balanced.",
    href: "/about#life-layers",
    category: "Product model",
    keywords: [
      "life layer",
      "body",
      "craft",
      "learning",
      "memory",
      "judgment",
      "contemplation",
      "life",
      "balance",
    ],
  },
  {
    title: "Behavior-based growth methodology",
    summary:
      "Growth observations use recorded behavior, available opportunities, time, and sample sufficiency rather than subjective satisfaction scores or a single ranking.",
    href: "/about#methodology",
    category: "Methodology",
    keywords: [
      "growth",
      "methodology",
      "connection",
      "trend",
      "sample",
      "evidence",
      "history",
    ],
  },
  {
    title: "Long-term action traces",
    summary:
      "Daily records become multi-week traces that make rhythm, reconnection, and sustained action visible over time.",
    href: "/#trace-history",
    category: "Product model",
    keywords: ["history", "trace", "week", "rhythm", "long term", "trend"],
  },
  {
    title: "Privacy and scope boundaries",
    summary:
      "Public product documentation is machine-readable, while account data, action records, insights, settings, and APIs remain outside the public knowledge corpus.",
    href: "/about#privacy",
    category: "Trust",
    keywords: ["privacy", "private", "security", "medical", "data", "account"],
  },
  {
    title: "Open-source identity and maintainership",
    summary:
      "Habit Runner publishes its implementation under the MIT license so its product rules and technical decisions can be inspected directly.",
    href: "/about#maintainer",
    category: "Trust",
    keywords: ["open source", "github", "license", "maintainer", "source"],
  },
  {
    title: "Citation and machine-readable resources",
    summary:
      "Use the canonical website for the product, the About page for methodology, and the GitHub repository for implementation-specific references.",
    href: "/about#citation",
    category: "Citation",
    keywords: ["citation", "cite", "llms", "machine", "ai", "crawler"],
  },
]

export function searchPublicKnowledge(query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (!normalizedQuery) return PUBLIC_KNOWLEDGE

  const terms = normalizedQuery.split(/\s+/).filter(Boolean)

  return PUBLIC_KNOWLEDGE.filter((entry) => {
    const haystack = [
      entry.title,
      entry.summary,
      entry.category,
      ...entry.keywords,
    ]
      .join(" ")
      .toLocaleLowerCase()

    return terms.every((term) => haystack.includes(term))
  })
}
