import { render, screen } from "@testing-library/react"

import { dashboardLinks } from "@/config/links"
import { DashboardNav } from "@/components/pages/dashboard/dashboard-nav"
import { getDictionary } from "@/lib/i18n"

describe("DashboardNav", () => {
  const dict = getDictionary("zh")

  test("renders DashboardNav component with items", () => {
    render(<DashboardNav items={dashboardLinks.data} />)

    expect(screen.getByText(dict.nav.links.dashboard)).toBeInTheDocument()
    expect(screen.getByText(dict.nav.links.insights)).toBeInTheDocument()
    expect(screen.getByText(dict.nav.links.settings)).toBeInTheDocument()
  })

  test("renders DashboardNav component with no items", () => {
    render(<DashboardNav items={[]} />)

    expect(screen.queryByText(dict.nav.links.dashboard)).toBeNull()
    expect(screen.queryByText(dict.nav.links.insights)).toBeNull()
  })
})
