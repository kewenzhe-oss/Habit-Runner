import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import { I18nProvider, useI18n, LOCALE_STORAGE_KEY, getDictionary } from "@/lib/i18n"
import { LanguageForm } from "@/components/settings/language-form"
import { UserAccountNav } from "@/components/user/user-account-nav"

// Mock ResizeObserver and PointerEvent for Radix UI in Jest
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.PointerEvent = MouseEvent as unknown as typeof PointerEvent
})

function TestConsumer() {
  const { locale, dict, setLocale } = useI18n()
  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="nav-dashboard">{dict.nav.links.dashboard}</span>
      <button onClick={() => setLocale("en")}>Set EN</button>
      <button onClick={() => setLocale("zh")}>Set ZH</button>
    </div>
  )
}

describe("i18n locale switching and persistence", () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = `${LOCALE_STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  })

  test("I18nProvider provides default zh and updates reactively on setLocale", () => {
    render(
      <I18nProvider initialLocale="zh">
        <TestConsumer />
      </I18nProvider>
    )

    expect(screen.getByTestId("current-locale")).toHaveTextContent("zh")
    expect(screen.getByTestId("nav-dashboard")).toHaveTextContent("我的行动")

    act(() => {
      fireEvent.click(screen.getByText("Set EN"))
    })

    expect(screen.getByTestId("current-locale")).toHaveTextContent("en")
    expect(screen.getByTestId("nav-dashboard")).toHaveTextContent("Dashboard")
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en")
    expect(document.cookie).toContain(`${LOCALE_STORAGE_KEY}=en`)
  })

  test("LanguageForm allows selecting English and updates context", () => {
    render(
      <I18nProvider initialLocale="zh">
        <LanguageForm />
        <TestConsumer />
      </I18nProvider>
    )

    expect(screen.getByTestId("current-locale")).toHaveTextContent("zh")

    const enRadio = screen.getByLabelText(/English/i)
    act(() => {
      fireEvent.click(enRadio)
    })

    expect(screen.getByTestId("current-locale")).toHaveTextContent("en")
    expect(screen.getByTestId("nav-dashboard")).toHaveTextContent("Dashboard")
  })

  test("UserAccountNav renders correctly for both app and public environments", () => {
    const zhDict = getDictionary("zh")
    const enDict = getDictionary("en")

    // In app environment
    const { unmount } = render(
      <I18nProvider initialLocale="zh">
        <UserAccountNav user={{ name: "Tester", email: "test@example.com" }} />
      </I18nProvider>
    )
    expect(
      screen.getByLabelText(zhDict.nav.actions.openAccountMenu)
    ).toBeInTheDocument()
    unmount()

    // In public environment
    render(
      <I18nProvider initialLocale="zh">
        <UserAccountNav
          user={{ name: "Tester", email: "test@example.com" }}
          locale="en"
        />
      </I18nProvider>
    )
    expect(
      screen.getByLabelText(enDict.nav.actions.openAccountMenu)
    ).toBeInTheDocument()
  })
})
