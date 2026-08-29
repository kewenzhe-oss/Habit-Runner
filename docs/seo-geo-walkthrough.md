# Habit Runner SEO/GEO Upgrade Walkthrough

Date: 2026-08-29  
Canonical origin: https://habits.dpdns.org  
Implementation scope: repository code and repository deployment configuration

## Outcome

Habit Runner now has one canonical public identity, explicit public/private crawl boundaries, AI-oriented machine knowledge feeds, connected JSON-LD entities, a small public authority surface, a real public search target for `SearchAction`, and deterministic regression checks.

The implementation improves machine readability and source consistency. It does not guarantee search indexing, rankings, rich results, generative-engine retrieval, or citation.

## Baseline

The 2026-08-29 pre-implementation review found:

- `/robots.txt` returned only `User-Agent: *` and `Allow: /`.
- `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, and `/about` returned 404 on the live domain.
- Public metadata did not provide canonical links.
- Open Graph output used the Vercel deployment origin while Firebase configuration used a separate `web.app` origin.
- No JSON-LD entity graph was present.
- Authentication and private application pages did not have a shared `noindex` policy.
- Public navigation did not expose methodology, source, citation, or machine-readable feeds.

## 1. Project optimization skill

Created `.agents/skills/geo-seo-optimization/SKILL.md`.

The project skill records:

- the canonical-domain invariant;
- the public/private route taxonomy;
- the supported AI crawler matrix;
- `llms.txt` and full-context content rules;
- JSON-LD truthfulness and safe-injection requirements;
- E-E-A-T evidence and limitation checks;
- deterministic validation gates;
- a prohibition on fabricated ratings, credentials, certifications, press, or growth claims.

The skill passes the bundled Skill Creator validator.

## 2. Crawlers and machine knowledge

`app/robots.ts` now explicitly addresses:

- OAI-SearchBot, GPTBot, and ChatGPT-User;
- PerplexityBot;
- ClaudeBot, Claude-SearchBot, Claude-User, and the backwards-compatible `anthropic-ai` token;
- Applebot-Extended, Google-Extended, Amazonbot, Bytespider, CCBot, and Diffbot.

Public pages and feeds remain crawlable. These private surfaces are disallowed:

- `/api`
- `/dashboard`
- `/items`
- `/insights`
- `/settings`
- `/today`
- `/signin`
- `/signup`

The rule output declares the canonical host and sitemap. Authentication and page-level robots metadata remain the actual privacy and indexation controls; robots directives do not expose private records.

Created:

- `public/llms.txt`: concise Markdown discovery index.
- `public/llms-full.txt`: factual product model, behavior methodology, energy states, life layers, privacy boundaries, technical identity, citation guide, and machine-use limitations.

The root document advertises `/llms.txt` with `rel="describedby"` and `type="text/markdown"`.

## 3. Canonical metadata and JSON-LD

`config/site.ts` now declares `https://habits.dpdns.org` as the stable public origin instead of deriving public identity from a deployment environment variable. The repository Firebase App Hosting configuration uses the same origin for `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`.

Created shared helpers:

- `lib/seo.ts`: canonical URL construction, public page metadata, private robots policy, and public-search robots policy.
- `lib/structured-data.ts`: deterministic Schema.org entities.
- `components/seo/structured-data.tsx`: JSON-LD script output with `<` escaped before injection.

Global entities:

- `Organization` at `https://habits.dpdns.org/#organization`.
- `WebSite` at `https://habits.dpdns.org/#website`.

Homepage entity:

- `WebApplication` at `https://habits.dpdns.org/#application`.
- A truthful zero-price Offer, operating-system scope, feature list, screenshot, and publisher relation.
- No `aggregateRating` or review data.

About entities:

- `AboutPage`.
- `BreadcrumbList`.

Search entity:

- `SearchResultsPage`.
- A `WebSite.SearchAction` backed by the working `/search?q={search_term_string}` public route.

Google no longer displays the former sitelinks search box, so `SearchAction` is retained as truthful machine semantics rather than advertised as a Google rich-result feature.

## 4. Authority, methodology, and navigation

Created `/about` with visible sections for:

- mission and product problem;
- the three distinct action models;
- seven life layers without a balance score;
- behavior-derived growth methodology;
- sample and history limitations;
- privacy and public/private scope;
- non-medical boundaries;
- open-source identity and maintainership;
- a citation guide;
- machine-readable resources.

Created `/search`, a static search surface over a curated public knowledge catalog. It never queries account data or the application database and is marked `noindex, follow`.

Public Header navigation now exposes About, Search, and Source. Mobile public navigation exposes Home, About, and Search. Footer navigation adds About, source, concise/full machine feeds, and the citation guide while preserving the application navigation variant.

Authentication and protected application routes inherit a shared `noindex` policy. Search results are excluded from the sitemap and use `noindex, follow`.

## 5. Sitemap and validation

Created `app/sitemap.ts` with only intentional indexable HTML pages:

- https://habits.dpdns.org/
- https://habits.dpdns.org/about

Authentication, search results, application pages, APIs, and text feeds are not sitemap entries.

Created:

- `scripts/verify-seo.mjs`
- `pnpm seo:check`
- `__tests__/seo/seo-config.test.ts`
- `__tests__/seo/structured-data.test.ts`
- `__tests__/seo/geo-assets.test.ts`

The checks fail on missing bot rules, domain drift, missing knowledge sections, malformed entity expectations, fabricated rating/review fields, incorrect sitemap scope, or broken public-search behavior.

## Runtime verification

An isolated production build was started on a temporary local port. These routes returned HTTP 200:

- `/`
- `/about`
- `/search?q=energy`
- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`
- `/llms-full.txt`
- `/signin`

Rendered output confirmed:

- About canonical: `https://habits.dpdns.org/about`.
- Search robots: `noindex, follow`.
- Sign-in robots: `noindex, nofollow, nocache`.
- JSON-LD includes Organization, WebSite, WebApplication, AboutPage, BreadcrumbList, SearchAction, and SearchResultsPage where intended.
- Sitemap URLs use only the canonical origin.
- Robots output contains all declared agents, private disallows, Host, and Sitemap.

## UI and accessibility verification

About and Search were checked at 1280×800 and 375×812 in the local production build.

- No horizontal overflow at either width.
- Dark and light surfaces remain distinguishable.
- The page has one H1 and sequential section headings.
- The public search input has a visible associated label.
- Navigation and buttons use semantic links/buttons and visible focus styles.
- Interactive targets use the project's 44px minimum.
- Mobile content clears the fixed bottom navigation.
- Search for `privacy` resolves to the public “Privacy and scope boundaries” source.

## Validation summary

- Skill validation: passed.
- SEO/GEO deterministic source check: passed.
- SEO tests: 3 suites, 12 tests passed.
- Full tests: 31 suites, 109 tests passed.
- TypeScript `--noEmit`: passed.
- ESLint `--max-warnings=0`: passed with zero warnings.
- Next.js production build: passed.
- `git diff --check`: passed.

The production build emitted the dependency-maintenance notice that `caniuse-lite` is outdated. It did not emit an ESLint warning or build error.

The repository-wide Prettier check still reports 65 pre-existing files outside this implementation. They were intentionally not reformatted because doing so would create a broad unrelated diff. Files changed by this implementation were formatted using the project configuration.

The existing migration UI test also prints React/Radix `act(...)` console notices, while all 109 tests pass. This was present outside the SEO/GEO scope and was not suppressed.

## Deployment follow-up

Repository implementation is complete. After deployment:

1. Confirm the Vercel production environment uses `https://habits.dpdns.org` for `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`.
2. Re-run the eight HTTP checks against the live domain.
3. Inspect live canonical, Open Graph, and JSON-LD output to confirm the deployment contains this revision.
4. Submit `https://habits.dpdns.org/sitemap.xml` to Google Search Console and Bing Webmaster Tools if those properties are available.
5. Request recrawl only after the canonical custom-domain deployment is live.

Search Console, Bing, Vercel dashboard settings, DNS, and deployment actions were not mutated by this repository-only implementation.

## Standards notes

- Reference architecture: https://github.com/zubair-trabzada/geo-seo-claude
- llms.txt proposal: https://llmstxt.org/
- OpenAI crawler guidance: https://developers.openai.com/api/docs/bots
- Anthropic crawler guidance: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Google Organization structured data: https://developers.google.com/search/docs/appearance/structured-data/organization
- Google Software Application structured data: https://developers.google.com/search/docs/appearance/structured-data/software-app
- Google sitelinks search box retirement: https://developers.google.com/search/blog/2024/10/sitelinks-search-box
