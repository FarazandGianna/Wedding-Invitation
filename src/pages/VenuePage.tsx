import SubPageLayout from './SubPage'

export default function VenuePage() {
  return (
    <SubPageLayout>
      {({ invitation, pageSettings, pageItems }) => {
        const settings = pageSettings.find((ps) => ps.page_type === 'venue')
        const venueItems = pageItems.filter((pi) => pi.page_type === 'venue')

        return (
          <div>
            <p className="text-xs uppercase tracking-widest2 text-clay">Where</p>
            <h1 className="mt-4 font-serif text-4xl text-ink">
              {settings?.page_title || 'Venue'}
            </h1>
            {settings?.page_subtitle && (
              <p className="mt-4 text-ink/70">{settings.page_subtitle}</p>
            )}

            {/* Venue details from the invitation record */}
            <div className="mt-10 space-y-6">
              {invitation.venue_name && (
                <div>
                  <h2 className="font-serif text-2xl text-ink">{invitation.venue_name}</h2>
                </div>
              )}

              {invitation.venue_address && (
                <div>
                  <p className="text-xs uppercase tracking-widest2 text-clay">Address</p>
                  <p className="mt-2 text-ink/80">{invitation.venue_address}</p>
                </div>
              )}

              {invitation.map_url && (
                <a
                  href={invitation.map_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center border border-ink/20 px-8 py-3 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  Open in Maps
                </a>
              )}
            </div>

            {/* Custom venue detail items (additional info) */}
            {venueItems.length > 0 && (
              <div className="mt-12">
                <div className="h-px w-12 bg-line mx-auto mb-8" />
                <div className="space-y-4">
                  {venueItems.map((item) => (
                    <div key={item.id} className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
                      <span className="text-xs uppercase tracking-widest2 text-clay">{item.label}</span>
                      <span className="font-serif text-lg text-ink">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact info */}
            {invitation.contact_name && (
              <div className="mt-12">
                <div className="h-px w-12 bg-line mx-auto mb-8" />
                <p className="text-center text-xs uppercase tracking-widest2 text-clay">Contact</p>
                <p className="mt-2 text-center text-ink/80">
                  {invitation.contact_name}
                  {invitation.contact_phone ? ` · ${invitation.contact_phone}` : ''}
                </p>
              </div>
            )}
          </div>
        )
      }}
    </SubPageLayout>
  )
}
