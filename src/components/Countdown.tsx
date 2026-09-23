import { useCountdown } from '../hooks/useCountdown'
import type { Invitation } from '../types/invitation'

export default function Countdown({ invitation }: { invitation: Invitation }) {
  const { days, hours, minutes, seconds, isPast } = useCountdown(
    invitation.wedding_date,
    invitation.wedding_time,
    invitation.timezone
  )

  return (
    <section id="countdown" className="border-y border-line/70 bg-paperDeep/50 px-6 py-16 text-center sm:py-20">
      <p className="text-xs uppercase tracking-widest2 text-clay">
        {isPast ? "We're celebrating" : 'Our Forever Begins In:'}
      </p>

      {isPast ? (
        <p className="mt-6 font-serif text-2xl text-ink">Thank you for celebrating with us.</p>
      ) : (
        <div className="mx-auto mt-6 flex max-w-md justify-center gap-4 sm:gap-8">
          <Unit value={days} label="Days" />
          <Unit value={hours} label="Hours" />
          <Unit value={minutes} label="Minutes" />
          <Unit value={seconds} label="Seconds" />
        </div>
      )}
    </section>
  )
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-serif text-3xl tabular-nums text-ink sm:text-4xl">{String(value).padStart(2, '0')}</span>
      <span className="mt-1 text-[10px] uppercase tracking-widest2 text-clay">{label}</span>
    </div>
  )
}
