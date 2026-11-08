import type { Locale } from "@/lib/i18n"

const PRESET_LABELS: Record<string, { name: string; en: string }> = {
  body: { name: "身体与健康", en: "Body & Health" },
  craft: { name: "技能与创造", en: "Skills & Creativity" },
  signal: { name: "学习与输入", en: "Learning" },
  contemplation: { name: "沉思与复盘", en: "Reflection" },
  life: { name: "生活日常", en: "Daily Life" },
}

export function categoryLabel(
  category: { name: string; icon?: string | null },
  locale: Locale
) {
  const preset = category.icon ? PRESET_LABELS[category.icon] : undefined
  return locale === "en" && preset?.name === category.name
    ? preset.en
    : category.name
}
