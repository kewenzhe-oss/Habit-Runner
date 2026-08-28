import {
  formatLocalizedDate,
  formatLocalizedMonthDay,
  formatLocalizedDateRange,
  formatLocalizedRelativeDay,
  formatLocalizedNumber,
  formatLocalizedPercent,
  formatLocalizedUnit,
  formatLocalizedDays,
  formatLocalizedTimes,
} from "@/lib/i18n"

describe("Locale-aware Formatters", () => {
  describe("formatLocalizedDate", () => {
    test("formats date string in Chinese and English", () => {
      const dateStr = "2026-08-28"
      const zh = formatLocalizedDate(dateStr, "zh")
      const en = formatLocalizedDate(dateStr, "en")

      expect(zh).toContain("2026")
      expect(zh).toContain("8")
      expect(en).toContain("2026")
      expect(en).toContain("Aug")
    })
  })

  describe("formatLocalizedMonthDay", () => {
    test("formats short month-day correctly", () => {
      const dateStr = "2026-08-28"
      expect(formatLocalizedMonthDay(dateStr, "zh")).toContain("8")
      expect(formatLocalizedMonthDay(dateStr, "en")).toContain("Aug")
    })
  })

  describe("formatLocalizedDateRange", () => {
    test("formats range with appropriate separators", () => {
      const from = "2026-08-22"
      const to = "2026-08-28"

      const zh = formatLocalizedDateRange(from, to, "zh")
      const en = formatLocalizedDateRange(from, to, "en")

      expect(zh).toContain("至")
      expect(en).toContain("Aug")
      expect(en).toContain("–")
    })
  })

  describe("formatLocalizedRelativeDay", () => {
    test("returns Today, Yesterday, or formatted date", () => {
      expect(formatLocalizedRelativeDay("2026-08-28", "2026-08-28", "zh")).toBe("今天")
      expect(formatLocalizedRelativeDay("2026-08-28", "2026-08-28", "en")).toBe("Today")
      expect(formatLocalizedRelativeDay("2026-08-27", "2026-08-28", "zh")).toBe("昨天")
      expect(formatLocalizedRelativeDay("2026-08-27", "2026-08-28", "en")).toBe("Yesterday")
    })
  })

  describe("formatLocalizedUnit", () => {
    test("maps standard unit labels into English singular/plural and Chinese", () => {
      expect(formatLocalizedUnit(20, "分钟", "zh")).toBe("分钟")
      expect(formatLocalizedUnit(20, "分钟", "en")).toBe("mins")
      expect(formatLocalizedUnit(1, "分钟", "en")).toBe("min")

      expect(formatLocalizedUnit(1, "次", "zh")).toBe("次")
      expect(formatLocalizedUnit(1, "次", "en")).toBe("time")
      expect(formatLocalizedUnit(5, "次", "en")).toBe("times")

      expect(formatLocalizedUnit(10, "页", "en")).toBe("pages")
      expect(formatLocalizedUnit(1, "页", "en")).toBe("page")
    })
  })

  describe("formatLocalizedDays & formatLocalizedTimes", () => {
    test("handles singular and plural days/times", () => {
      expect(formatLocalizedDays(1, "zh")).toBe("1 天")
      expect(formatLocalizedDays(1, "en")).toBe("1 day")
      expect(formatLocalizedDays(5, "en")).toBe("5 days")

      expect(formatLocalizedTimes(1, "zh")).toBe("1 次")
      expect(formatLocalizedTimes(1, "en")).toBe("1 time")
      expect(formatLocalizedTimes(3, "en")).toBe("3 times")
    })
  })

  describe("formatLocalizedPercent & formatLocalizedNumber", () => {
    test("formats percentages and localized numbers", () => {
      expect(formatLocalizedPercent(85.4)).toBe("85%")
      expect(formatLocalizedNumber(1250, "zh")).toBe("1,250")
      expect(formatLocalizedNumber(1250, "en")).toBe("1,250")
    })
  })
})
