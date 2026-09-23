import { formatInZone, zonedWallTimeToInstant } from './time'

/**
 * Formats the wedding date/time as wall-clock time in the invitation's own
 * timezone (NOT the guest's device timezone), so every guest sees the same
 * date and time the couple intended.
 */
export function formatEventDate(dateStr: string, timeStr: string | null, timezone: string): string {
  const instant = zonedWallTimeToInstant(dateStr, timeStr, timezone)
  if (Number.isNaN(instant)) return dateStr

  let result = formatInZone(
    instant, timezone,
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    dateStr
  )
  if (timeStr) {
    const formattedTime = formatInZone(instant, timezone, { hour: 'numeric', minute: '2-digit' })
    if (formattedTime) result += ` · ${formattedTime}`
  }
  return result
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}
