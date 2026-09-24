import { isSectionEnabled } from '../hooks/useInvitation'
import Itinerary from '../components/Itinerary'
import { formatEventDate } from '../utils/format'
import SubPageLayout from './SubPage'

export default function DetailsPage() {
  return (
    <SubPageLayout>
      {({ invitation, sections, events, pageSettings, pageItems }) => {
        const settings = pageSettings.find((ps) => ps.page_type === 'details')
        const detailItems = pageItems.filter((pi) => pi.page_type === 'details')
        const showItinerary = isSectionEnabled(sections, 'itinerary') && events.length > 0

        return (
          <div>
            <p className="text-xs uppercase tracking-widest2 text-clay">The Details</p>
            <h1 className="mt-4 font-serif text-4xl text-ink">
              {settings?.page_title || 'The Details'}
            </h1>
            {settings?.page_subtitle && (
              <p className="mt-4 text-ink/70">{settings.page_subtitle}</p>
            )}

            {/* When & Where summary */}
            <div className="mt-10 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-widest2 text-clay">When</p>
                <p className="mt-2 text-ink/80">
                  {formatEventDate(invitation.wedding_date, invitation.wedding_time, invitation.timezone)}
                </p>
              </div>

              {invitation.venue_name && (
                <div>
                  <p className="text-xs uppercase tracking-widest2 text-clay">Where</p>
                  <p className="mt-2 text-ink/80">{invitation.venue_name}</p>
                  {invitation.venue_address && (
                    <p className="text-ink/60">{invitation.venue_address}</p>
                  )}
                </div>
              )}

              {invitation.contact_name && (
                <div>
                  <p className="text-xs uppercase tracking-widest2 text-clay">Questions?</p>
                  <p className="mt-2 text-ink/80">
                    {invitation.contact_name}
                    {invitation.contact_phone ? ` · ${invitation.contact_phone}` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Custom detail items (smoking, drinking, ceremony, etc.) */}
            {detailItems.length > 0 && (
              <div className="mt-12">
                <div className="h-px w-12 bg-line mx-auto mb-8" />
                <div className="space-y-4">
                  {detailItems.map((item) => (
                    <div key={item.id} className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
                      <span className="text-xs uppercase tracking-widest2 text-clay">{item.label}</span>
                      <span className="font-serif text-lg text-ink">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary events */}
            {showItinerary && (
              <div className="mt-12">
                <div className="h-px w-12 bg-line mx-auto mb-8" />
                <p className="text-center text-xs uppercase tracking-widest2 text-clay">Itinerary</p>
                <h2 className="mt-2 mb-6 text-center font-serif text-2xl text-ink">Celebration Schedule</h2>
                <Itinerary events={events} />
              </div>
            )}
          </div>
        )
      }}
    </SubPageLayout>
  )
}
