/**
 * Shared timezone helpers: interpret a stored wall-clock date/time as a
 * specific IANA timezone and convert to/from absolute instants without
 * pulling in a timezone library.
 */

/**
 * Converts a wall-clock date+time in `timezone` to the absolute UTC instant
 * (ms since epoch). Returns NaN if the inputs can't be parsed as a date.
 */
export function zonedWallTimeToInstant(
  dateStr: string,
  timeStr: string | null,
  timezone: string
): number {
  const time = (timeStr ?? '00:00:00').slice(0, 8)
  const naiveIso = `${dateStr}T${time.length === 5 ? `${time}:00` : time}`
  const naiveUtcGuess = Date.parse(`${naiveIso}Z`)
  if (Number.isNaN(naiveUtcGuess)) return NaN

  try {
    const offsetMinutes = getTimezoneOffsetMinutes(timezone, naiveUtcGuess)
    return naiveUtcGuess - offsetMinutes * 60000
  } catch {
    // Unknown timezone string — fall back to treating it as UTC.
    return naiveUtcGuess
  }
}

/** Offset of `timeZone` from UTC, in minutes, at the given instant. */
export function getTimezoneOffsetMinutes(timeZone: string, atUtcMs: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  const parts = dtf.formatToParts(new Date(atUtcMs))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return (asUtc - atUtcMs) / 60000
}

/** Formats an absolute instant in a timezone; returns fallback on bad input. */
export function formatInZone(
  instantMs: number,
  timezone: string,
  options: Intl.DateTimeFormatOptions,
  fallback = ''
): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: timezone, ...options }).format(instantMs)
  } catch {
    return fallback
  }
}
