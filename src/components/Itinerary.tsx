import type { WeddingEvent } from '../types/invitation'
import { formatEventDate } from '../utils/format'

interface Props {
  events: WeddingEvent[]
}

/**
 * Itinerary content — designed to be rendered inside a Modal.
 * Renders the timeline of Pakistan events.
 */
export default function Itinerary({ events }: Props) {
  if (events.length === 0) return null

  return (
    <div className="text-left">
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[19px] top-2 bottom-2 w-px bg-line/40"
          aria-hidden="true"
        />

        <ol className="space-y-10">
          {events.map((event, idx) => (
            <li
              key={event.id}
              className="animate-fade-up relative pl-14"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Dot on the timeline */}
              <span
                className="absolute left-[12px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-gold bg-paper"
                aria-hidden="true"
              />

              <div className="border border-line/30 bg-paperDeep/40 px-6 py-6">
                <h3 className="font-serif text-2xl text-ink">{event.title}</h3>

                {event.event_date && (
                  <p className="mt-2 text-sm text-clay">
                    {formatEventDate(event.event_date, event.event_time, event.timezone)}
                  </p>
                )}

                {event.description && (
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">
                    {event.description}
                  </p>
                )}

                {(event.venue_name || event.venue_address) && (
                  <div className="mt-4">
                    {event.venue_name && (
                      <p className="text-sm font-medium text-ink/80">{event.venue_name}</p>
                    )}
                    {event.venue_address && (
                      <p className="mt-1 text-xs text-ink/60">{event.venue_address}</p>
                    )}
                  </div>
                )}

                {event.dress_code && (
                  <p className="mt-3 text-xs uppercase tracking-widest2 text-clay">
                    Dress code: {event.dress_code}
                  </p>
                )}

                {event.map_url && (
                  <a
                    href={event.map_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex min-h-10 items-center justify-center border border-ink/20 px-6 py-2.5 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink hover:text-paper"
                  >
                    Open in Maps
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
