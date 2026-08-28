import Link from "next/link"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { getDictionary } from "@/lib/i18n"
import { buttonVariants } from "@/components/ui/button"
import HeadingText from "@/components/heading-text"
import { Icons } from "@/components/icons"

export default function OpenSource() {
  const dict = getDictionary("zh").landing.openSource

  return (
    <section className="container py-12 lg:py-20">
      <div className="flex flex-col items-center gap-4">
        <HeadingText
          subtext={dict.subtext}
          className="text-center"
        >
          {dict.title}
        </HeadingText>
        <Link
          href={siteConfig.links.github}
          target="_blank"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <Icons.star className="mr-2 h-4 w-4" />
          <span>{dict.githubButton}</span>
        </Link>
      </div>
    </section>
  )
}
