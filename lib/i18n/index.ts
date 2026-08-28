import zhCommon from "@/messages/zh/common.json"
import zhNav from "@/messages/zh/nav.json"
import zhLanding from "@/messages/zh/landing.json"
import zhAuth from "@/messages/zh/auth.json"
import zhDashboard from "@/messages/zh/dashboard.json"
import zhAction from "@/messages/zh/action.json"
import zhForm from "@/messages/zh/form.json"
import zhInsights from "@/messages/zh/insights.json"
import zhItem from "@/messages/zh/item.json"

import enCommon from "@/messages/en/common.json"
import enNav from "@/messages/en/nav.json"
import enLanding from "@/messages/en/landing.json"
import enAuth from "@/messages/en/auth.json"
import enDashboard from "@/messages/en/dashboard.json"
import enAction from "@/messages/en/action.json"
import enForm from "@/messages/en/form.json"
import enInsights from "@/messages/en/insights.json"
import enItem from "@/messages/en/item.json"

export type Locale = "zh" | "en"

export const PUBLIC_LOCALE: Locale = "en"
export const DEFAULT_APP_LOCALE: Locale = "zh"

export const dictionaries = {
  zh: {
    common: zhCommon,
    nav: zhNav,
    landing: zhLanding,
    auth: zhAuth,
    dashboard: zhDashboard,
    action: zhAction,
    form: zhForm,
    insights: zhInsights,
    item: zhItem,
  },
  en: {
    common: enCommon,
    nav: enNav,
    landing: enLanding,
    auth: enAuth,
    dashboard: enDashboard,
    action: enAction,
    form: enForm,
    insights: enInsights,
    item: enItem,
  },
} as const

export type Dictionaries = typeof dictionaries.zh
export type Namespace = keyof Dictionaries

export function getDictionary(locale: Locale = "zh") {
  return dictionaries[locale] || dictionaries.zh
}

/**
 * Format string template like "Hello {name}" with params { name: "Alice" }
 */
export function formatString(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`
  })
}

export * from "./context"
export * from "./formatters"
