import { Locale } from "./index"

/**
 * Standard Locale-aware formatting utilities for URUS / IotaWise
 */

const LOCALE_MAP: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
}

/**
 * Format a calendar date string (YYYY-MM-DD) or Date object into localized human-readable string.
 */
export function formatLocalizedDate(
  dateInput: string | Date,
  locale: Locale = "zh",
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    let date: Date
    if (typeof dateInput === "string") {
      const [year, month, day] = dateInput.split("-").map(Number)
      date = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0))
    } else {
      date = dateInput
    }

    const defaultOptions: Intl.DateTimeFormatOptions = options || {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }

    return new Intl.DateTimeFormat(LOCALE_MAP[locale] || "zh-CN", defaultOptions).format(date)
  } catch {
    return String(dateInput)
  }
}

/**
 * Format a short month-day string (e.g. "8月28日" or "Aug 28").
 */
export function formatLocalizedMonthDay(
  dateInput: string | Date,
  locale: Locale = "zh"
): string {
  return formatLocalizedDate(dateInput, locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

/**
 * Format a date range string (e.g. "2026-08-22 至 2026-08-28" or "Aug 22 – Aug 28, 2026").
 */
export function formatLocalizedDateRange(
  fromStr: string,
  toStr: string,
  locale: Locale = "zh"
): string {
  try {
    if (locale === "zh") {
      return `${formatLocalizedDate(fromStr, "zh")} 至 ${formatLocalizedDate(toStr, "zh")}`
    }
    const fromParts = formatLocalizedDate(fromStr, "en", { month: "short", day: "numeric", timeZone: "UTC" })
    const toParts = formatLocalizedDate(toStr, "en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    return `${fromParts} – ${toParts}`
  } catch {
    return `${fromStr} - ${toStr}`
  }
}

/**
 * Format relative day difference (e.g. Today / Yesterday / Tomorrow / Localized Date)
 */
export function formatLocalizedRelativeDay(
  targetDateStr: string,
  todayStr: string,
  locale: Locale = "zh"
): string {
  if (targetDateStr === todayStr) {
    return locale === "zh" ? "今天" : "Today"
  }
  // calculate difference in days
  try {
    const [tY, tM, tD] = todayStr.split("-").map(Number)
    const [dY, dM, dD] = targetDateStr.split("-").map(Number)
    const today = Date.UTC(tY, tM - 1, tD)
    const target = Date.UTC(dY, dM - 1, dD)
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24))

    if (diffDays === -1) return locale === "zh" ? "昨天" : "Yesterday"
    if (diffDays === -2) return locale === "zh" ? "前天" : "2 days ago"
    if (diffDays === 1) return locale === "zh" ? "明天" : "Tomorrow"
  } catch {
    // fallback
  }

  return formatLocalizedMonthDay(targetDateStr, locale)
}

/**
 * Format localized numbers with standard separators.
 */
export function formatLocalizedNumber(
  value: number,
  locale: Locale = "zh",
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(LOCALE_MAP[locale] || "zh-CN", options).format(value)
  } catch {
    return String(value)
  }
}

/**
 * Format percentage (e.g. "85%").
 */
export function formatLocalizedPercent(value: number): string {
  return `${Math.round(value)}%`
}

/**
 * Map unit labels according to active locale (e.g. "分钟" -> "mins", "次" -> "times", "页" -> "pages", "组" -> "sets").
 */
const UNIT_TRANSLATIONS: Record<string, { zh: string; en: string; enPlural?: string }> = {
  "分钟": { zh: "分钟", en: "min", enPlural: "mins" },
  "min": { zh: "分钟", en: "min", enPlural: "mins" },
  "mins": { zh: "分钟", en: "min", enPlural: "mins" },
  "小时": { zh: "小时", en: "hr", enPlural: "hrs" },
  "hour": { zh: "小时", en: "hr", enPlural: "hrs" },
  "次": { zh: "次", en: "time", enPlural: "times" },
  "个": { zh: "个", en: "count", enPlural: "counts" },
  "页": { zh: "页", en: "page", enPlural: "pages" },
  "组": { zh: "组", en: "set", enPlural: "sets" },
  "km": { zh: "公里", en: "km", enPlural: "km" },
  "公里": { zh: "公里", en: "km", enPlural: "km" },
  "千米": { zh: "公里", en: "km", enPlural: "km" },
  "米": { zh: "米", en: "m", enPlural: "m" },
  "天": { zh: "天", en: "day", enPlural: "days" },
  "day": { zh: "天", en: "day", enPlural: "days" },
  "days": { zh: "天", en: "day", enPlural: "days" },
}

export function formatLocalizedUnit(
  amount: number,
  unitLabel: string | null | undefined,
  locale: Locale = "zh"
): string {
  if (!unitLabel || !unitLabel.trim()) {
    return locale === "zh" ? "次" : (amount === 1 ? "time" : "times")
  }
  const clean = unitLabel.trim()
  const mapping = UNIT_TRANSLATIONS[clean]
  if (mapping) {
    if (locale === "zh") return mapping.zh
    return amount === 1 ? mapping.en : (mapping.enPlural || `${mapping.en}s`)
  }
  return clean
}

/**
 * Format count of days with localized singular / plural suffixes.
 */
export function formatLocalizedDays(count: number, locale: Locale = "zh"): string {
  if (locale === "zh") return `${count} 天`
  return `${count} ${count === 1 ? "day" : "days"}`
}

/**
 * Format count of times/occurrences with localized singular / plural suffixes.
 */
export function formatLocalizedTimes(count: number, locale: Locale = "zh"): string {
  if (locale === "zh") return `${count} 次`
  return `${count} ${count === 1 ? "time" : "times"}`
}
