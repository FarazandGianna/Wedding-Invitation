import { useEffect, useRef, useState } from 'react'
import Monogram from './Monogram'

interface Props {
  names: string
  initialLeft: string
  initialRight: string
  ready: boolean // true once invitation data has finished loading
  onDone: () => void
}

/**
 * Brief mark-reveal opener. If data is already ready by the time the
 * minimum reveal time elapses, it dismisses immediately; if data is slower,
 * it keeps showing the mark (no spinner) until ready, then dismisses.
 */
export default function OpeningAnimation({ names, initialLeft, initialRight, ready, onDone }: Props) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [leaving, setLeaving] = useState(false)
  // Guards the dismissal so it fires exactly once for this mount.
  const doneRef = useRef(false)

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const t = window.setTimeout(() => setMinTimeElapsed(true), prefersReducedMotion ? 150 : 900)
    return () => window.clearTimeout(t)
  }, [prefersReducedMotion])

  useEffect(() => {
    // Deliberately NO cleanup on this timeout: cancelling it when deps change
    // (e.g. `leaving` flipping to true) would cancel onDone itself and leave
    // the overlay stuck on screen forever.
    if (ready && minTimeElapsed && !leaving && !doneRef.current) {
      setLeaving(true)
      window.setTimeout(() => {
        doneRef.current = true
        onDone()
      }, prefersReducedMotion ? 50 : 500)
    }
  }, [ready, minTimeElapsed, leaving, onDone, prefersReducedMotion])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper transition-opacity duration-500 ${
        leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={leaving}
    >
      <Monogram
        letterLeft={initialLeft}
        letterRight={initialRight}
        className="h-40 w-auto text-gold animate-fade-up sm:h-48"
      />
      <p className="mt-2 text-xs uppercase tracking-widest2 text-clay animate-fade" style={{ animationDelay: '150ms' }}>
        You're invited
      </p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-ink animate-fade-up" style={{ animationDelay: '250ms' }}>
        {names}
      </h1>
    </div>
  )
}
