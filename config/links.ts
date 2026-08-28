import { Navigation } from "@/types"
import { getDictionary } from "@/lib/i18n"

const dict = getDictionary("zh")

export const navLinks: Navigation = {
  data: [
    {
      title: dict.nav.links.dashboard,
      href: "/dashboard",
    },
    {
      title: dict.nav.links.insights,
      href: "/insights",
    },
    {
      title: dict.nav.links.settings,
      href: "/settings",
    },
  ],
}

export const dashboardLinks: Navigation = {
  data: [
    {
      title: dict.nav.links.dashboard,
      href: "/dashboard",
      icon: "dashboard",
    },
    {
      title: dict.nav.links.insights,
      href: "/insights",
      icon: "history",
    },
    {
      title: dict.nav.links.settings,
      href: "/settings",
      icon: "settings",
    },
  ],
}
