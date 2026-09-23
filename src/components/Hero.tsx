import type { Invitation } from '../types/invitation'
import { formatEventDate } from '../utils/format'
import Monogram from './Monogram'

export default function Hero({ invitation }: { invitation: Invitation }) {
  return (
    <section id="invitation" className="flex min-h-[92vh] flex-col items-center justify-center px-6 text-center">
      <Monogram
        letterLeft={invitation.bride_name.charAt(0).toUpperCase()}
        letterRight={invitation.groom_name.charAt(0).toUpperCase()}
        className="animate-fade-up h-28 w-auto text-gold sm:h-32"
      />
      <p className="animate-fade-up mt-4 text-xs uppercase tracking-widest2 text-clay" style={{ animationDelay: '80ms' }}>
        {invitation.invitation_title || 'Together with our families'}
      </p>
      <h1 className="animate-fade-up mt-6 font-serif text-5xl leading-tight text-ink sm:text-7xl" style={{ animationDelay: '100ms' }}>
        {invitation.bride_name}
        <span className="mx-3 font-display italic text-clay sm:mx-4">&amp;</span>
        {invitation.groom_name}
      </h1>
      <div className="animate-fade-up mt-8 h-px w-12 bg-line" style={{ animationDelay: '200ms' }} />
      <p className="animate-fade-up mt-8 font-serif text-lg text-ink/80 sm:text-xl" style={{ animationDelay: '250ms' }}>
        {formatEventDate(invitation.wedding_date, invitation.wedding_time, invitation.timezone)}
      </p>
      {invitation.venue_name && (
        <p className="animate-fade-up mt-2 text-sm text-clay" style={{ animationDelay: '300ms' }}>
          {invitation.venue_name}
        </p>
      )}
    </section>
  )
}
