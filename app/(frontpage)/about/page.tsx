import { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { buildPageMetadata } from "@/lib/seo"
import {
  createAboutPageJsonLd,
  createBreadcrumbJsonLd,
} from "@/lib/structured-data"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { StructuredData } from "@/components/seo/structured-data"

export const metadata: Metadata = buildPageMetadata({
  title: "About Habit Runner",
  description:
    "Learn how Habit Runner turns real behavior, energy-aware action, and time into non-shaming growth insight, with clear privacy and evidence boundaries.",
  path: "/about",
})

const productModels = [
  {
    title: "Habit",
    description:
      "A positive repeated behavior, recorded with the amount or action that was actually completed.",
    icon: Icons.habit,
  },
  {
    title: "Reduction behavior",
    description:
      "A behavior being reduced, with maintained days and lapses recorded as awareness rather than moral judgment.",
    icon: Icons.quitHabit,
  },
  {
    title: "Task",
    description:
      "A finite action with a completion state, kept distinct from recurring habit logic.",
    icon: Icons.todo,
  },
]

const lifeLayers = [
  "Body",
  "Craft",
  "Signal",
  "Memory",
  "Judgment",
  "Contemplation",
  "Life",
]

export default function AboutPage() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-10 sm:px-6 md:pt-14"
    >
      <StructuredData
        id="habit-runner-about-page"
        data={createAboutPageJsonLd()}
      />
      <StructuredData
        id="habit-runner-about-breadcrumbs"
        data={createBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-8 text-sm text-muted-foreground"
      >
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href="/"
              className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            About
          </li>
        </ol>
      </nav>

      <section className="max-w-3xl space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Mission, method, and boundaries
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Growth that stays connected to real life.
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Habit Runner is built around a simple premise: use the energy you
          genuinely have today to keep running the person you want to become.
          The product turns recorded behavior into a view of rhythm over time,
          without treating a low-energy action or conscious rest as personal
          failure.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="#methodology"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            Read the methodology
            <Icons.next className="h-4 w-4" />
          </Link>
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "gap-2"
            )}
          >
            Inspect the source
            <Icons.externalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mt-16 space-y-16 md:mt-24">
        <section
          aria-labelledby="why-title"
          className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Why it exists
            </p>
            <h2
              id="why-title"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Beyond complete or incomplete
            </h2>
          </div>
          <div className="space-y-4 text-base leading-7 text-muted-foreground">
            <p>
              Binary tracking can make the full target the only acceptable
              outcome. When energy is limited, abandoning the record can feel
              easier than acknowledging a smaller but real action.
            </p>
            <p>
              Habit Runner embeds High, Normal, Low, and Rest into the action
              flow. These are contexts for adapting an action—not grades of a
              person. The goal is durable connection, not a perfect performance
              surface.
            </p>
          </div>
        </section>

        <section
          id="product-model"
          aria-labelledby="model-title"
          className="scroll-mt-24 space-y-6"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product model
            </p>
            <h2
              id="model-title"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Three actions, three different psychological jobs
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {productModels.map((model) => {
              const Icon = model.icon
              return (
                <Card key={model.title} className="p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{model.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {model.description}
                  </p>
                </Card>
              )
            })}
          </div>
        </section>

        <section
          id="life-layers"
          aria-labelledby="layers-title"
          className="scroll-mt-24 rounded-2xl border bg-muted/20 p-6 sm:p-8"
        >
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-background text-primary">
                <Icons.layers className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2
                id="layers-title"
                className="mt-5 text-2xl font-bold tracking-tight"
              >
                Seven life layers, without a balance score
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Layers show where behavior has been accumulating. They do not
                claim that every life should be equally distributed or that a
                single shape can measure wellbeing.
              </p>
            </div>
            <ul
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
              aria-label="Habit Runner life layers"
            >
              {lifeLayers.map((layer) => (
                <li
                  key={layer}
                  className="rounded-lg border bg-background px-3 py-3 text-sm font-medium"
                >
                  {layer}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="methodology"
          aria-labelledby="method-title"
          className="grid scroll-mt-24 gap-8 md:grid-cols-[0.8fr_1.2fr]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Methodology
            </p>
            <h2
              id="method-title"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              What the product can responsibly say
            </h2>
          </div>
          <div className="space-y-5 text-base leading-7 text-muted-foreground">
            <p>
              Growth observations are grounded in recorded actions, available
              opportunities, time windows, and sample sufficiency. They are not
              subjective satisfaction scores and do not rank one life layer as
              morally stronger than another.
            </p>
            <p>
              When historical plan changes, pauses, or resumptions are
              incomplete, Habit Runner labels the result as a current-plan
              estimate. When samples are too small, the product favors “data is
              still accumulating” over a confident growth judgment.
            </p>
            <div className="rounded-xl border-l-4 border-l-primary bg-muted/40 p-5 text-sm leading-6 text-foreground">
              A connection rate or trend is evidence about recorded behavior in
              a defined period. It is not a complete description of a person,
              their health, or the value of their life.
            </div>
          </div>
        </section>

        <section
          id="privacy"
          aria-labelledby="privacy-title"
          className="grid scroll-mt-24 gap-6 rounded-2xl border p-6 sm:p-8 md:grid-cols-[auto_1fr]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icons.quitHabit className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="privacy-title"
              className="text-2xl font-bold tracking-tight"
            >
              Privacy and scope
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Public pages and machine feeds describe the product. Account
                data, action records, history, insights, settings, and
                application APIs are excluded from the public knowledge corpus
                and protected by the application authentication boundary.
              </p>
              <p>
                Habit Runner is a personal action tool, not a medical device,
                diagnostic service, or substitute for professional medical or
                mental-health advice. The project does not claim regulatory
                certification.
              </p>
            </div>
          </div>
        </section>

        <section
          id="maintainer"
          aria-labelledby="source-title"
          className="grid scroll-mt-24 gap-8 md:grid-cols-2"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inspectable authority
            </p>
            <h2
              id="source-title"
              className="mt-2 text-2xl font-bold tracking-tight"
            >
              Open source before authority language
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Habit Runner is maintained as an open-source project and published
              under the MIT license. The repository is the authoritative source
              for technical implementation; this page is the authoritative
              source for public product meaning and boundaries.
            </p>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View kewenzhe-oss/Habit-Runner
              <Icons.externalLink className="h-4 w-4" />
            </Link>
          </div>

          <div
            id="citation"
            className="scroll-mt-24 rounded-2xl bg-foreground p-6 text-background sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-background/60">
              Citation guide
            </p>
            <h2 className="mt-2 text-xl font-bold">
              Cite the claim at its source
            </h2>
            <p className="mt-3 text-sm leading-6 text-background/75">
              Use the homepage for the product, this About page for methodology
              and privacy boundaries, and GitHub for implementation details.
            </p>
            <figure className="mt-5 border-l border-background/30 pl-4">
              <blockquote className="text-sm leading-6">
                Habit Runner. “Habit Runner — Energy-Adaptive Habit Tracking.”
                https://habits.dpdns.org/. Accessed [date].
              </blockquote>
            </figure>
          </div>
        </section>

        <section aria-labelledby="machine-title" className="border-t pt-10">
          <h2 id="machine-title" className="text-xl font-bold">
            Machine-readable resources
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            These resources make public facts easier to retrieve. They do not
            guarantee indexing, ranking, or citation by a search or generative
            system.
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            <li>
              <Link
                href="/llms.txt"
                className={buttonVariants({ variant: "outline" })}
              >
                llms.txt
              </Link>
            </li>
            <li>
              <Link
                href="/llms-full.txt"
                className={buttonVariants({ variant: "outline" })}
              >
                llms-full.txt
              </Link>
            </li>
            <li>
              <Link
                href="/sitemap.xml"
                className={buttonVariants({ variant: "outline" })}
              >
                sitemap.xml
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
