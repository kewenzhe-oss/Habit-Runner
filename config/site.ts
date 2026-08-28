import { SiteConfig } from "@/types"

import { env } from "@/env.mjs"

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
    base: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    author: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  links: {
    github: "https://github.com/kewenzhe-oss/Habit-Runner",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/og.jpg`,
}
