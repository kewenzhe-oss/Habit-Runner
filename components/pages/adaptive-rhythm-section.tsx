import { getDictionary } from "@/lib/i18n"

export default function AdaptiveRhythmSection() {
  const dict = getDictionary("zh").landing.adaptive
  const tiers = [
    {
      number: "01",
      title: dict.tierHighTitle,
      action: dict.tierHighDesc,
    },
    {
      number: "02",
      title: dict.tierNormalTitle,
      action: dict.tierNormalDesc,
    },
    {
      number: "03",
      title: dict.tierLowTitle,
      action: dict.tierLowDesc,
      highlighted: true,
    },
    {
      number: "04",
      title: dict.tierRestTitle,
      action: dict.tierRestDesc,
    },
  ]

  return (
    <section
      aria-labelledby="adaptive-rhythm-heading"
      className="border-t bg-muted/20 px-4 py-14 sm:px-6 sm:py-20"
      id="adaptive-rhythm"
    >
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-16">
        <header className="min-w-0 lg:pt-2">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground">
            {dict.sectionBadge}
          </p>
          <h2
            className="mt-4 text-balance text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl"
            id="adaptive-rhythm-heading"
          >
            {dict.sectionTitle}
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
            {dict.sectionSubtext}
          </p>
        </header>

        <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-background">
          <header className="px-4 py-5 sm:px-6">
            <p className="text-xs font-medium text-muted-foreground">
              {dict.exampleLabel}
            </p>
            <h3 className="mt-1 text-base font-semibold text-foreground">
              {dict.exampleTitle}
            </h3>
          </header>

          <ol className="divide-y divide-border border-t border-border">
            {tiers.map((tier) => (
              <li
                className={tier.highlighted ? "bg-muted/30" : undefined}
                key={tier.number}
              >
                <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 px-4 py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4 sm:px-6">
                  <span
                    aria-hidden="true"
                    className="pt-0.5 text-xs font-medium tabular-nums text-muted-foreground"
                  >
                    {tier.number}
                  </span>
                  <div className="min-w-0">
                    <h4 className="break-words text-sm font-semibold leading-5 text-foreground sm:text-base">
                      {tier.title}
                    </h4>
                    <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
                      {tier.action}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
