import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CoupleMessage from '../components/CoupleMessage'
import Countdown from '../components/Countdown'
import EnvelopeIntro from '../components/EnvelopeIntro'
import Footer from '../components/Footer'
import Gallery from '../components/Gallery'
import Hero from '../components/Hero'
import Modal from '../components/Modal'
import Nav from '../components/Nav'
import Registry from '../components/Registry'
import RSVPForm from '../components/RSVPForm'
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
  const [openModal, setOpenModal] = useState<'itinerary' | 'registry' | null>(null)

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

  // Build nav items: sub-pages (Details, Venue, FAQ) from page_settings,
  // plus RSVP and Gallery as scroll targets on the main page.
  const navItems = ready
    ? ([
        ...state.pageSettings
          .filter((ps) => ps.is_enabled)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((ps) => ({
            label: ps.button_label || (ps.page_type === 'faq' ? 'FAQ' : ps.page_type.charAt(0).toUpperCase() + ps.page_type.slice(1)),
            route: ps.page_type as string | undefined,
            targetId: undefined as string | undefined
          })),
        isSectionEnabled(state.sections, 'gallery') && state.gallery.length > 0 && { label: 'Gallery', route: undefined, targetId: 'gallery' },
        isSectionEnabled(state.sections, 'rsvp') && { label: 'RSVP', route: undefined, targetId: 'rsvp' }
      ].filter(Boolean) as { label: string; route?: string; targetId?: string }[])
    : []

  function handleNav(targetId: string) {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
          <Nav items={navItems} onNavigate={handleNav} slug={slug} />
          <Hero invitation={state.invitation} />

          {/* Tagline — admin-editable subtitle below the hero */}
          {state.invitation.tagline && (
            <section className="mx-auto max-w-2xl px-6 py-12 text-center sm:py-16">
              <div className="mx-auto mb-8 h-px w-12 bg-line" />
              <p className="font-serif text-2xl leading-relaxed text-ink sm:text-3xl">
                {state.invitation.tagline}
              </p>
            </section>
          )}

          {isSectionEnabled(state.sections, 'message') && <CoupleMessage invitation={state.invitation} />}
          {isSectionEnabled(state.sections, 'countdown') && <Countdown invitation={state.invitation} />}

          {/* Registry card on the main page (if items exist) */}
          {isSectionEnabled(state.sections, 'registry') && state.registry.length > 0 && (
            <section className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
              <div className="grid grid-cols-1 sm:max-w-sm sm:mx-auto">
                <button
                  type="button"
                  onClick={() => setOpenModal('registry')}
                  className="group flex flex-col items-center justify-center border border-gold/40 bg-gold/5 px-6 py-10 text-center transition-all duration-300 hover:border-gold hover:bg-gold/10"
                >
                  <svg className="mb-4 text-gold transition-transform duration-300 group-hover:scale-110" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12V22H4V12" />
                    <path d="M2 7h20v5H2z" />
                    <path d="M12 22V7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                  <p className="text-xs uppercase tracking-widest2 text-clay">Wedding Registry</p>
                  <h3 className="mt-2 font-serif text-xl text-ink">Gifts &amp; Wishes</h3>
                  <p className="mt-2 text-sm text-ink/60">
                    {state.registry.length} {state.registry.length === 1 ? 'registry' : 'registries'}
                  </p>
                  <span className="mt-4 text-xs uppercase tracking-widest2 text-gold transition-colors group-hover:text-ink">
                    View registry →
                  </span>
                </button>
              </div>
            </section>
          )}

          {isSectionEnabled(state.sections, 'gallery') && state.gallery.length > 0 && <Gallery items={state.gallery} />}
          {isSectionEnabled(state.sections, 'rsvp') && <RSVPForm invitation={state.invitation} />}
          <Footer invitation={state.invitation} />

          {/* Registry modal */}
          {isSectionEnabled(state.sections, 'registry') && state.registry.length > 0 && (
            <Modal
              open={openModal === 'registry'}
              onClose={() => setOpenModal(null)}
              label="Wedding Registry"
              title="Gifts & Wishes"
              subtitle="Your presence is the greatest gift. If you would like to give something more, here are our registries."
            >
              <Registry items={state.registry} />
            </Modal>
          )}
        </div>
      )}
    </>
  )
}
