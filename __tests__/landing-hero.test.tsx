import { render, screen } from "@testing-library/react"

import HeroHeader from "@/components/pages/hero"

describe("landing hero CTA", () => {
  it("shows one action and sends signed-out users through the shared sign-in flow", () => {
    render(<HeroHeader isAuthenticated={false} />)

    const links = screen.getAllByRole("link", { name: /进入我的行动/ })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute("href", "/signin?redirect=%2Fdashboard")
    expect(screen.queryByText("登录账户")).not.toBeInTheDocument()
  })

  it("sends signed-in users directly to the dashboard", () => {
    render(<HeroHeader isAuthenticated />)

    expect(screen.getByRole("link", { name: /进入我的行动/ })).toHaveAttribute(
      "href",
      "/dashboard"
    )
  })
})
