import { SiteConfig } from "@/types"

export const PRIMARY_SITE_URL = "https://habits.dpdns.org"

export const siteConfig: SiteConfig = {
  name: "Habit Runner",
  author: "Habit Runner Team",
  description:
    "With the energy you truly have today, run the person you want to become. 4-tier energy adaptive habit, reduction and task tracking.",
  keywords: [
    "Habit Runner",
    "Energy-based Habits",
    "Habit Tracker",
    "Low Energy Action",
    "Micro Actions",
    "Quit Habit",
    "Todo",
    "Next.js",
    "React",
    "Tailwind CSS",
  ],
  url: {
    base: PRIMARY_SITE_URL,
    author: `${PRIMARY_SITE_URL}/about#maintainer`,
  },
  links: {
    github: "https://github.com/kewenzhe-oss/Habit-Runner",
  },
  ogImage: `${PRIMARY_SITE_URL}/og.jpg`,
}
