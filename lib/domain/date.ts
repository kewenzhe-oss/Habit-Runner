const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Format an instant as a calendar date in the user's IANA time zone. */
export function formatDateInTimeZone(
  date: Date = new Date(),
  timeZone: string = "UTC"
): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date)
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value])
    )
    return `${values.year}-${values.month}-${values.day}`
  } catch {
    return formatDateInTimeZone(date, "UTC")
  }
}

export function parseCalendarDate(date: string): Date {
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Invalid calendar date: ${date}`)
  }

  const [year, month, day] = date.split("-").map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${date}`)
  }
  return parsed
}

export function addCalendarDays(date: string, amount: number): string {
  const parsed = parseCalendarDate(date)
  parsed.setUTCDate(parsed.getUTCDate() + amount)
  return parsed.toISOString().slice(0, 10)
}

export function calendarDayOfWeek(date: string): number {
  return parseCalendarDate(date).getUTCDay()
}

export function enumerateCalendarDates(from: string, to: string): string[] {
  const start = parseCalendarDate(from)
  const end = parseCalendarDate(to)
  if (start > end) return []

  const dates: string[] = []
  for (let cursor = from; cursor <= to; cursor = addCalendarDays(cursor, 1)) {
    dates.push(cursor)
  }
  return dates
}

export function calendarDaysInclusive(from: string, to: string): number {
  const start = parseCalendarDate(from).getTime()
  const end = parseCalendarDate(to).getTime()
  return end < start ? 0 : Math.floor((end - start) / 86_400_000) + 1
}

export function createdAtCalendarDate(
  createdAt: Date,
  timeZone: string
): string {
  return formatDateInTimeZone(createdAt, timeZone)
}

/** Returns the 7 calendar dates (Mon-Sun) of the week containing dateStr. */
export function getCalendarWeekDates(dateStr: string): string[] {
  const dayOfWeek = calendarDayOfWeek(dateStr)
  // Day of week: 0 is Sun, 1 is Mon, 2 is Tue, 3 is Wed, 4 is Thu, 5 is Fri, 6 is Sat
  const offsetFromMonday = (dayOfWeek + 6) % 7
  const monday = addCalendarDays(dateStr, -offsetFromMonday)
  return Array.from({ length: 7 }, (_, i) => addCalendarDays(monday, i))
}

