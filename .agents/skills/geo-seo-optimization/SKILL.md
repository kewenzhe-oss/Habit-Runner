---
name: geo-seo-optimization
description: Audit and improve Habit Runner's public SEO, AI crawler access, machine-readable knowledge, structured data, authority content, canonical URLs, and sitemap without exposing private user data or inventing trust signals.
---

# Habit Runner GEO/SEO Optimization

Use this skill for SEO, generative-engine discoverability, structured data, public authority content, crawler policy, or indexation work in this repository.

## Non-negotiable invariants

- Treat `https://habits.dpdns.org` as the only public canonical origin. Do not emit `vercel.app`, `web.app`, localhost, or request-derived origins in canonical URLs, Open Graph data, JSON-LD, sitemaps, or machine feeds.
- Keep authenticated records private. Never expose user actions, account data, API responses, database identifiers, or protected route content in SEO assets.
- Publicly index only intentional public HTML pages. Authentication, application, API, and search-result routes must be excluded or marked `noindex` as appropriate.
- Do not fabricate ratings, reviews, credentials, press coverage, user counts, awards, legal certifications, research validation, founders, addresses, or dates.
- Describe `llms.txt`, crawler directives, and JSON-LD as machine-readable signals, not guarantees of indexing, ranking, citation, or rich results.

## Audit workflow

1. Establish a baseline from the repository and rendered routes. Record canonical, metadata, robots, sitemap, JSON-LD, status codes, and domain drift before editing.
2. Classify routes as public-indexable, public-noindex, protected, authentication, API, or static machine resources.
3. Make public facts consistent across visible copy, metadata, JSON-LD, `llms.txt`, `llms-full.txt`, sitemap, and project documentation.
4. Run deterministic checks, type checking, tests, lint, formatting, and a production build.
5. Produce a walkthrough that separates verified results from deployment-console follow-ups.

## Crawl policy

Explicitly account for current search and AI agents, including `OAI-SearchBot`, `GPTBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `anthropic-ai`, `Applebot-Extended`, `Google-Extended`, `Amazonbot`, `Bytespider`, `CCBot`, and `Diffbot`.

Allow public pages and machine feeds. Disallow `/api/`, `/dashboard/`, `/items/`, `/insights/`, `/settings/`, `/today/`, `/signin`, and `/signup`. Robots rules supplement authentication and page-level `noindex`; they do not replace either control.

## Machine knowledge feeds

- Keep `public/llms.txt` concise and navigational: one H1, one blockquote summary, clear H2 sections, and canonical Markdown links.
- Keep `public/llms-full.txt` factual and self-contained. Cover the product problem, three item models, four energy states, seven life layers, longitudinal insights, privacy boundaries, public resources, technical identity, and citation guidance.
- Link the concise feed from the document head with `rel="describedby"` and `type="text/markdown"`.
- Exclude private data, secrets, internal API payloads, speculative roadmap claims, and unsupported superlatives.

## Structured data

- Generate JSON-LD through shared typed functions and a script component that escapes `<` before injection.
- Use stable canonical `@id` values to connect `Organization`, `WebSite`, and page entities.
- Add `SearchAction` only while `/search?q={search_term_string}` is functional and limited to public knowledge.
- Use `WebApplication` only with visible, verifiable product fields. A zero-price offer is acceptable for a genuinely free web application; omit ratings and reviews until real public evidence exists.
- Add page-specific types only when the visible page supports them. Do not add `HowTo`, `Article`, `FAQPage`, or review schema merely for eligibility.
- Validate generated JSON and confirm every URL uses the canonical origin.

## E-E-A-T and content checks

- Make the project mission, maintainership, open-source repository, methodology, privacy boundary, limitations, and citation format visible on the public About page.
- Distinguish behavior-derived observations from subjective wellbeing claims. Explain estimates or incomplete history where relevant.
- State that Habit Runner is a personal action tool, not medical advice or a diagnostic service.
- Prefer inspectable evidence and source links over authority language.

## Validation gates

- Sitemap contains only canonical, indexable HTML pages.
- Public pages have self-canonicals; search and authentication routes are `noindex`; protected layouts inherit private robots metadata.
- No old hosting origin appears in SEO surfaces.
- Required bots, feeds, schema types, and feed links are present.
- Format, lint with zero warnings, TypeScript, tests, production build, and local route checks pass.
- The final report records exact commands, outcomes, remaining external deployment actions, and any limitations.
