import type { Invitation } from '../types/invitation'
import { formatEventDate } from '../utils/format'

export default function EventDetails({ invitation }: { invitation: Invitation }) {
  return (
    <section id="details" className="mx-auto max-w-md px-6 py-20 text-center sm:py-28">
      <p className="text-xs uppercase tracking-widest2 text-clay">The Details</p>
      <h2 className="mt-4 font-serif text-3xl text-ink">When</h2>
      <p className="mt-3 text-ink/80">{formatEventDate(invitation.wedding_date, invitation.wedding_time, invitation.timezone)}</p>

      {invitation.contact_name && (
        <div className="mt-10">
          <p className="text-xs uppercase tracking-widest2 text-clay">Questions?</p>
          <p className="mt-3 text-ink/80">
            {invitation.contact_name}
            {invitation.contact_phone ? ` · ${invitation.contact_phone}` : ''}
          </p>
        </div>
      )}
    </section>
  )
}
