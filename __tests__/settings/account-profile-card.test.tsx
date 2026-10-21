import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { I18nProvider } from "@/lib/i18n"
import { AccountProfileCard } from "@/components/settings/account-profile-card"

const signOut = jest.fn()

jest.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}))

describe("AccountProfileCard", () => {
  beforeEach(() => {
    signOut.mockReset()
  })

  it("shows read-only account context with a visible sign-out action", async () => {
    const user = userEvent.setup()
    render(
      <I18nProvider initialLocale="zh">
        <AccountProfileCard
          email="reader@example.com"
          joinedAt="2026-10-01T12:00:00.000Z"
          timezone="America/New_York"
        />
      </I18nProvider>
    )

    expect(screen.getByText("账户信息")).toBeInTheDocument()
    expect(screen.getByText("reader@example.com")).toBeInTheDocument()
    expect(screen.getByText("America/New_York")).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "退出登录" }))
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/signin" })
  })
})
