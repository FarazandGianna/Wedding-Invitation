import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CoupleMessage from '../components/CoupleMessage'
import Countdown from '../components/Countdown'
import EventDetails from '../components/EventDetails'
import Footer from '../components/Footer'
import Gallery from '../components/Gallery'
import Hero from '../components/Hero'
import Nav from '../components/Nav'
import OpeningAnimation from '../components/OpeningAnimation'
import RSVPForm from '../components/RSVPForm'
import Venue from '../components/Venue'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { isSectionEnabled, useInvitation } from '../hooks/useInvitation'
import { applyInvitationMeta } from '../utils/meta'
import NotFoundPage from './NotFound'

export default function InvitationPage() {
  const { slug } = useParams<{ slug: string }>()
  const state = useInvitation(slug)
  const [openingDone, setOpeningDone] = useState(false)

  useEffect(() => {
    if (state.status === 'ready') applyInvitationMeta(state.invitation)
  }, [state])

  // Distinct, actionable state for a deployment missing its env vars — much
  // better than a scary network error pointing guests at their connection.
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <p className="text-xs uppercase tracking-widest2 text-clay">One moment</p>
        <h1 className="mt-4 font-serif text-2xl text-ink">This invitation isn't set up yet</h1>
        <p className="mt-3 max-w-sm text-ink/70">Please check back soon.</p>
      </div>
    )
  }

  if (state.status === 'not-found') return <NotFoundPage />

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <p className="text-xs uppercase tracking-widest2 text-clay">Something went wrong</p>
        <h1 className="mt-4 font-serif text-2xl text-ink">We couldn't load this invitation</h1>
        <p className="mt-3 max-w-sm text-ink/70">Please check your connection and try refreshing the page.</p>
      </div>
    )
  }

  const ready = state.status === 'ready'
  const names = ready ? `${state.invitation.bride_name} & ${state.invitation.groom_name}` : ''
  const initialLeft = ready ? state.invitation.bride_name.charAt(0).toUpperCase() : ''
  const initialRight = ready ? state.invitation.groom_name.charAt(0).toUpperCase() : ''

  const navItems = ready
    ? [
        isSectionEnabled(state.sections, 'details') && { label: 'Details', href: '#details' },
        isSectionEnabled(state.sections, 'venue') && { label: 'Location', href: '#location' },
        isSectionEnabled(state.sections, 'gallery') && state.gallery.length > 0 && { label: 'Gallery', href: '#gallery' },
        isSectionEnabled(state.sections, 'rsvp') && { label: 'RSVP', href: '#rsvp' }
      ].filter((x): x is { label: string; href: string } => Boolean(x))
    : []

  return (
    <>
      {!openingDone && (
        <OpeningAnimation
          names={names || 'Loading…'}
          initialLeft={initialLeft || '?'}
          initialRight={initialRight || '?'}
          ready={ready}
          onDone={() => setOpeningDone(true)}
        />
      )}

      {ready && openingDone && (
        <div className="min-h-screen bg-paper">
          <Nav items={navItems} />
          <Hero invitation={state.invitation} />
          {isSectionEnabled(state.sections, 'message') && <CoupleMessage invitation={state.invitation} />}
          {isSectionEnabled(state.sections, 'countdown') && <Countdown invitation={state.invitation} />}
          {isSectionEnabled(state.sections, 'details') && <EventDetails invitation={state.invitation} />}
          {isSectionEnabled(state.sections, 'venue') && <Venue invitation={state.invitation} />}
          {isSectionEnabled(state.sections, 'gallery') && <Gallery items={state.gallery} />}
          {isSectionEnabled(state.sections, 'rsvp') && <RSVPForm invitation={state.invitation} />}
          <Footer invitation={state.invitation} />
        </div>
      )}
    </>
  )
}
