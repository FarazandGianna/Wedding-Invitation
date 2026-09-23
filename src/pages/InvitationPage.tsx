import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CoupleMessage from '../components/CoupleMessage'
import Countdown from '../components/Countdown'
import EnvelopeIntro from '../components/EnvelopeIntro'
import EventDetails from '../components/EventDetails'
import Footer from '../components/Footer'
import Gallery from '../components/Gallery'
import Hero from '../components/Hero'
import Nav from '../components/Nav'
import RSVPForm from '../components/RSVPForm'
import Venue from '../components/Venue'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { isSectionEnabled, useInvitation } from '../hooks/useInvitation'
import { applyInvitationMeta } from '../utils/meta'
import NotFoundPage from './NotFound'

// First-visit gate for the envelope experience: sessionStorage survives
// reloads in the same tab but resets for each new visit, so guests get the
// full experience on every fresh open without it blocking their navigation.
const SEEN_KEY = 'fg-intro-seen'

export default function InvitationPage() {
  const { slug } = useParams<{ slug: string }>()
  const state = useInvitation(slug)
  const [introDone, setIntroDone] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage.getItem(SEEN_KEY) === '1'
  )

  useEffect(() => {
    if (state.status === 'ready') applyInvitationMeta(state.invitation)
  }, [state])

  const finishIntro = () => {
    window.sessionStorage.setItem(SEEN_KEY, '1')
    setIntroDone(true)
  }

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

  const navItems = ready
    ? [
        isSectionEnabled(state.sections, 'details') && { label: 'Details', targetId: 'details' },
        isSectionEnabled(state.sections, 'venue') && { label: 'Location', targetId: 'location' },
        isSectionEnabled(state.sections, 'gallery') && state.gallery.length > 0 && { label: 'Gallery', targetId: 'gallery' },
        isSectionEnabled(state.sections, 'rsvp') && { label: 'RSVP', targetId: 'rsvp' }
      ].filter((x): x is { label: string; targetId: string } => Boolean(x))
    : []

  return (
    <>
      {/* The envelope opens while data loads; the card (stage 2) waits for the
          real record, so guests always see true names/date/venue. */}
      {!introDone && <EnvelopeIntro invitation={ready ? state.invitation : null} onFinished={finishIntro} />}

      {ready && (
        <div
          className="min-h-screen bg-paper"
          style={{
            opacity: introDone ? 1 : 0,
            transition: 'opacity 1200ms ease'
          }}
          aria-hidden={!introDone}
        >
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
