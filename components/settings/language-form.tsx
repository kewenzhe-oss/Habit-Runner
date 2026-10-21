"use client"

import { useI18n } from "@/lib/i18n"
import { triggerHaptic } from "@/lib/haptics"

export function LanguageForm() {
  const { locale, setLocale, dict, format } = useI18n()
  const next = locale === "zh" ? "en" : "zh"
  const label = format(dict.item.settingsPage.switchLanguage, {
    current: locale === "zh" ? "简体中文" : "English",
    next: next === "zh" ? "简体中文" : "English",
  })
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-2">
      <span className="text-sm font-medium">
        {dict.item.settingsPage.languageTitle}
      </span>
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={() => {
          triggerHaptic("light")
          setLocale(next)
        }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-input bg-background text-sm font-semibold transition-[background-color,transform] duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:-rotate-6 active:scale-95 motion-reduce:transform-none"
      >
        <span aria-hidden="true" lang={locale === "zh" ? "zh-CN" : "en"}>
          {locale === "zh" ? "中" : "EN"}
        </span>
      </button>
    </div>
  )
}
