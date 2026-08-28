import { calendarDayOfWeek, enumerateCalendarDates } from "@/lib/domain/date"

export type ScheduleConfig = {
  frequencyDays?: string | null
  targetPerWeek?: number | null
}

const FLEXIBLE_FREQUENCIES = new Set(["3_4_DAYS", "3_4_TIMES"])

export function getFixedWeekdays(
  frequencyDays?: string | null
): number[] | null {
  if (!frequencyDays || FLEXIBLE_FREQUENCIES.has(frequencyDays)) return null

  const values = frequencyDays.split(",").map((value) => Number(value.trim()))
  if (
    values.length === 0 ||
    values.some((value) => !Number.isInteger(value) || value < 0 || value > 6)
  ) {
    return null
  }

  return Array.from(new Set(values))
}

export function isFlexibleSchedule(frequencyDays?: string | null): boolean {
  return Boolean(frequencyDays && FLEXIBLE_FREQUENCIES.has(frequencyDays))
}

export function isScheduledDate(
  date: string,
  schedule: ScheduleConfig
): boolean {
  if (isFlexibleSchedule(schedule.frequencyDays)) return true
  const fixedWeekdays = getFixedWeekdays(schedule.frequencyDays)
  return fixedWeekdays ? fixedWeekdays.includes(calendarDayOfWeek(date)) : true
}

/**
 * Count expected opportunities without treating off-days as missed days.
 * Flexible weekly schedules are evaluated per seven-day slice so a 4/week
 * habit has four opportunities, not seven.
 */
export function countScheduledOpportunities(
  from: string,
  to: string,
  schedule: ScheduleConfig
): number {
  const dates = enumerateCalendarDates(from, to)
  if (isFlexibleSchedule(schedule.frequencyDays)) {
    const target = Math.min(7, Math.max(1, schedule.targetPerWeek || 4))
    let total = 0
    for (let index = 0; index < dates.length; index += 7) {
      total += Math.min(target, dates.slice(index, index + 7).length)
    }
    return total
  }

  return dates.filter((date) => isScheduledDate(date, schedule)).length
}
