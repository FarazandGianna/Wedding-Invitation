import type { Invitation } from '../types/invitation'

export default function Venue({ invitation }: { invitation: Invitation }) {
  if (!invitation.venue_name && !invitation.venue_address) return null

  return (
    <section id="location" className="mx-auto max-w-md px-6 py-20 text-center sm:py-28">
      <p className="text-xs uppercase tracking-widest2 text-clay">Where</p>
      {invitation.venue_name && <h2 className="mt-4 font-serif text-3xl text-ink">{invitation.venue_name}</h2>}
      {invitation.venue_address && <p className="mt-3 text-ink/80">{invitation.venue_address}</p>}

      {invitation.map_url && (
        <a
          href={invitation.map_url}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex min-h-11 items-center justify-center border border-ink/20 px-8 py-3 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Open in Maps
        </a>
      )}
    </section>
  )
}
