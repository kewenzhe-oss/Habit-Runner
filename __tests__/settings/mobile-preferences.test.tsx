import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "next-themes"

import { I18nProvider } from "@/lib/i18n"
import { AppearanceForm } from "@/components/settings/appearance-form"

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn(() => ({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  })
})

it("uses one control to switch and persist both themes without submitting a form", async () => {
  const user = userEvent.setup()
  render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <I18nProvider initialLocale="zh">
        <AppearanceForm />
      </I18nProvider>
    </ThemeProvider>
  )
  expect(screen.getAllByRole("button")).toHaveLength(1)
  await user.click(screen.getByRole("button", { name: "切换为夜间深色" }))
  expect(document.documentElement).toHaveClass("dark")
  expect(localStorage.getItem("theme")).toBe("dark")
  await user.click(screen.getByRole("button", { name: "切换为日间明亮" }))
  expect(document.documentElement).toHaveClass("light")
  expect(localStorage.getItem("theme")).toBe("light")
})

it("switches away from the resolved system theme on the first tap", async () => {
  const user = userEvent.setup()
  render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider initialLocale="zh">
        <AppearanceForm />
      </I18nProvider>
    </ThemeProvider>
  )
  expect(document.documentElement).toHaveClass("dark")
  await user.click(screen.getByRole("button", { name: "切换为日间明亮" }))
  expect(document.documentElement).toHaveClass("light")
  expect(localStorage.getItem("theme")).toBe("light")
})
