import {
  addCalendarDays,
  calendarDaysInclusive,
  formatDateInTimeZone,
} from "@/lib/domain/date"
import {
  countScheduledOpportunities,
  isScheduledDate,
} from "@/lib/domain/schedule"

describe("calendar dates and schedules", () => {
  it("formats the same instant in the user's time zone", () => {
    const instant = new Date("2026-08-28T02:30:00.000Z")
    expect(formatDateInTimeZone(instant, "America/New_York")).toBe("2026-08-27")
    expect(formatDateInTimeZone(instant, "Asia/Shanghai")).toBe("2026-08-28")
  })

  it("does calendar math without local-time DST drift", () => {
    expect(addCalendarDays("2026-03-08", 1)).toBe("2026-03-09")
    expect(calendarDaysInclusive("2026-03-07", "2026-03-09")).toBe(3)
  })

  it("excludes off-days from fixed weekday opportunities", () => {
    const workdays = { frequencyDays: "1,2,3,4,5", targetPerWeek: 5 }
    expect(isScheduledDate("2026-08-29", workdays)).toBe(false)
    expect(
      countScheduledOpportunities("2026-08-24", "2026-08-30", workdays)
    ).toBe(5)
  })

  it("uses the weekly target for flexible schedules", () => {
    expect(
      countScheduledOpportunities("2026-08-24", "2026-08-30", {
        frequencyDays: "3_4_DAYS",
        targetPerWeek: 4,
      })
    ).toBe(4)
  })
})
