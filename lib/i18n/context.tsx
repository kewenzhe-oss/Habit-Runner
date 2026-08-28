"use client"

import * as React from "react"
import { dictionaries, Dictionaries, formatString, getDictionary, Locale } from "./index"

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  dict: Dictionaries
  format: (template: string, params?: Record<string, string | number>) => string
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

export const LOCALE_STORAGE_KEY = "habit_runner_locale"

function getCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(^| )${LOCALE_STORAGE_KEY}=([^;]+)`))
  const val = match ? match[2] : null
  if (val === "zh" || val === "en") return val
  return null
}

interface I18nProviderProps {
  children: React.ReactNode
  initialLocale?: Locale
}

export function I18nProvider({
  children,
  initialLocale = "zh",
}: I18nProviderProps) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale)

  // Initialize from storage / cookie on client mount if explicitly saved
  React.useEffect(() => {
    try {
      const cookieVal = getCookieLocale()
      if (cookieVal) {
        setLocaleState(cookieVal)
        return
      }

      const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
      if (saved && (saved === "zh" || saved === "en")) {
        setLocaleState(saved)
        document.cookie = `${LOCALE_STORAGE_KEY}=${saved};path=/;max-age=31536000;SameSite=Lax`
        return
      }
    } catch {
      // ignore
    }
  }, [])

  const setLocale = React.useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
      document.cookie = `${LOCALE_STORAGE_KEY}=${nextLocale};path=/;max-age=31536000;SameSite=Lax`
    } catch {
      // ignore
    }
  }, [])

  const dict = React.useMemo(() => getDictionary(locale), [locale])

  const format = React.useCallback(
    (template: string, params?: Record<string, string | number>) => {
      return formatString(template, params)
    },
    []
  )

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      dict,
      format,
    }),
    [locale, setLocale, dict, format]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = React.useContext(I18nContext)
  if (!context) {
    // Safe fallback if used outside of I18nProvider (e.g. static tests or public page fallback)
    const fallbackDict = getDictionary("zh")
    return {
      locale: "zh" as Locale,
      setLocale: () => {},
      dict: fallbackDict,
      format: formatString,
    }
  }
  return context
}
