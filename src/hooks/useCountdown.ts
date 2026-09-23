import { useEffect, useState } from 'react'
import { zonedWallTimeToInstant } from '../utils/time'

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

/**
 * Computes the target instant once from the wedding date/time/timezone
 * (using each guest's own device for "now", compared against the same
 * absolute instant everyone shares) and ticks a single 1s interval only
 * while the countdown is still running.
 */
export function useCountdown(weddingDate: string, weddingTime: string | null, timezone: string): CountdownParts {
  const [target] = useState(() => zonedWallTimeToInstant(weddingDate, weddingTime, timezone))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (Number.isNaN(target) || target <= Date.now()) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [target])

  const diff = Number.isNaN(target) ? -1 : target - now
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  }

  const seconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    isPast: false
  }
}
