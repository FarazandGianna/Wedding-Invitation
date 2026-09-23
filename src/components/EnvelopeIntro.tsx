/**
 * Four-stage first-open experience inspired by the reference storyboard:
 *   1. Sealed envelope appears with gold monogram seal
 *   2. "YOU ARE CORDIALLY INVITED" shimmers in beneath the envelope
 *   3. Click → flap opens smoothly, card rises out
 *   4. Click card → dissolves into the real website
 *
 * Everything uses the site's palette (wine paper, warm gold, ink cream)
 * and the canonical FG monogram. Motion is slow and soft — no bounce, no
 * spin. `prefers-reduced-motion` collapses transforms, keeps the same flow.
 *
 * The invitation card (stage 3) only appears once the real database record
 * has loaded, so the card always shows the true names/date/venue.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Invitation } from '../types/invitation'
import { formatEventDate } from '../utils/format'
import FgMonogram from './FgMonogram'

interface Props {
  /** Null until the invitation has loaded from Supabase. */
  invitation: Invitation | null
  onFinished: () => void
}

type Stage = 'sealed' | 'opening' | 'card' | 'entering'

const TIMING = {
  flapOpenMs: 1600, // flap lift after click 1 — slower, more cinematic
  cardRiseMs: 1800, // card emerges after the flap
  enterMs: 1400 // card → website dissolve after click 2
}

const EASE_LUX = 'cubic-bezier(0.33, 0.02, 0.2, 1)' // soft, expensive feel

const isTouch =
  typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

export default function EnvelopeIntro({ invitation, onFinished }: Props) {
  const [stage, setStage] = useState<Stage>('sealed')
  const [showInvited, setShowInvited] = useState(false)
  const timers = useRef<number[]>([])
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const store = timers.current
    return () => {
      store.forEach((t) => window.clearTimeout(t))
      store.length = 0
    }
  }, [])

  const after = useCallback(
    (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, reduced ? Math.min(ms, 250) : ms))
    },
    [reduced]
  )

  // Stage 2: "YOU ARE CORDIALLY INVITED" appears shortly after the envelope
  useEffect(() => {
    after(reduced ? 200 : 1200, () => setShowInvited(true))
  }, [reduced, after])

  const openEnvelope = useCallback(() => {
    if (stage !== 'sealed') return
    setShowInvited(false)
    setStage('opening')
  }, [stage])

  // The card rises only once the flap is open AND the data is ready
  useEffect(() => {
    if (stage !== 'opening' || !invitation) return
    after(TIMING.flapOpenMs * 0.55, () => setStage('card'))
  }, [stage, invitation, after])

  const enterSite = useCallback(() => {
    if (stage !== 'card') return
    setStage('entering')
    after(TIMING.enterMs, onFinished)
  }, [stage, after, onFinished])

  const onCard = stage === 'card'
  const envelopeOpen = stage !== 'sealed'

  const names = invitation
    ? `${invitation.bride_name} & ${invitation.groom_name}`.toUpperCase()
    : ''
  const dateLine = invitation
    ? formatEventDate(invitation.wedding_date, invitation.wedding_time, invitation.timezone)
    : ''
  const venueLine =
    (invitation?.venue_name && invitation.venue_name !== 'BLANK'
      ? invitation.venue_name
      : invitation?.venue_address) || undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-paper"
      role="dialog"
      aria-label="Wedding invitation"
      style={{ perspective: '1400px' }}
    >
      {/* Soft atmospheric depth: gold ambiance behind the envelope */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(closest-side, rgba(201,168,119,0.12), transparent 70%)',
            opacity: stage === 'entering' ? 0 : 1,
            transition: `opacity ${TIMING.enterMs}ms ease`
          }}
        />
      </div>

      {/* ======================== THE ENVELOPE ======================== */}
      <div
        className="relative select-none"
        style={{
          width: 'min(88vw, 560px)',
          aspectRatio: '8 / 5.4',
          transform:
            stage === 'entering'
              ? 'translateZ(-90px) scale(0.96)'
              : onCard
                ? 'translateZ(-70px) scale(0.98)'
                : 'none',
          opacity: stage === 'entering' ? 0 : 1,
          transition: `transform ${TIMING.enterMs}ms ${EASE_LUX}, opacity ${TIMING.enterMs}ms ease`,
          cursor: stage === 'sealed' ? 'pointer' : 'default'
        }}
        onClick={openEnvelope}
        onKeyDown={(e) => {
          if (stage === 'sealed' && (e.key === 'Enter' || e.key === ' ')) openEnvelope()
        }}
        role={stage === 'sealed' ? 'button' : undefined}
        tabIndex={stage === 'sealed' ? 0 : undefined}
        aria-label={stage === 'sealed' ? 'Open the envelope' : undefined}
      >
        {/* envelope body (back panel) */}
        <div
          className="absolute inset-0 rounded-[3px]"
          style={{
            background: 'linear-gradient(160deg, #43101c 0%, #360b14 55%, #2d0911 100%)',
            boxShadow: '0 24px 60px -18px rgba(0,0,0,0.65), inset 0 1px 0 rgba(240,226,208,0.06)'
          }}
        />

        {/* inner lining (becomes visible once the flap opens) */}
        <div
          className="absolute inset-x-[3%] top-[4%] bottom-[3%] rounded-[2px]"
          style={{
            background: 'linear-gradient(175deg, #47131f 0%, #3a0d17 100%)',
            opacity: envelopeOpen ? 1 : 0,
            transition: 'opacity 900ms ease'
          }}
        />

        {/* Card slide wrapper: clips the card while sealed/opening */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: onCard || stage === 'entering' ? 5 : 3,
            overflow: onCard || stage === 'entering' ? 'visible' : 'hidden'
          }}
        >
        {/* the invitation card, sliding up out of the envelope */}
        <div
          className="absolute left-1/2 w-[82%] rounded-[2px]"
          style={{
            bottom: '6%',
            height: '128%',
            transform: `translateX(-50%) translateY(${onCard || stage === 'entering' ? '17%' : '28%'}) scale(${stage === 'entering' ? 1.05 : 1})`,
            transition: `transform ${TIMING.cardRiseMs}ms ${EASE_LUX}`,
            pointerEvents: onCard ? 'auto' : 'none',
            cursor: onCard ? 'pointer' : 'default'
          }}
          onClick={enterSite}
          onKeyDown={(e) => {
            if (onCard && (e.key === 'Enter' || e.key === ' ')) enterSite()
          }}
          role={onCard ? 'button' : undefined}
          tabIndex={onCard ? 0 : undefined}
          aria-label={onCard ? 'Continue to the invitation' : undefined}
        >
          {/* card paper */}
          <div
            className="absolute inset-0 rounded-[2px] border border-line/60"
            style={{
              background: 'linear-gradient(170deg, #f3e7d3 0%, #ead9bf 60%, #e2cfae 100%)',
              boxShadow: '0 -10px 40px -12px rgba(0,0,0,0.55)'
            }}
          />
          {/* ornate corner flourishes on the card */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {/* Top-left corner */}
            <svg className="absolute left-2 top-2 h-8 w-8 text-[#8a6f52]/50" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M2 2 C 12 2, 16 6, 18 14 C 14 8, 8 6, 2 6" />
              <path d="M2 2 C 2 8, 4 12, 10 14 C 6 10, 4 6, 2 2" opacity="0.6" />
            </svg>
            {/* Top-right corner */}
            <svg className="absolute right-2 top-2 h-8 w-8 text-[#8a6f52]/50" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M30 2 C 20 2, 16 6, 14 14 C 18 8, 24 6, 30 6" />
              <path d="M30 2 C 30 8, 28 12, 22 14 C 26 10, 28 6, 30 2" opacity="0.6" />
            </svg>
            {/* Bottom-left corner */}
            <svg className="absolute bottom-2 left-2 h-8 w-8 text-[#8a6f52]/50" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M2 30 C 12 30, 16 26, 18 18 C 14 24, 8 26, 2 26" />
              <path d="M2 30 C 2 24, 4 20, 10 18 C 6 22, 4 26, 2 30" opacity="0.6" />
            </svg>
            {/* Bottom-right corner */}
            <svg className="absolute bottom-2 right-2 h-8 w-8 text-[#8a6f52]/50" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M30 30 C 20 30, 16 26, 14 18 C 18 24, 24 26, 30 26" />
              <path d="M30 30 C 30 24, 28 20, 22 18 C 26 22, 28 26, 30 30" opacity="0.6" />
            </svg>
          </div>
          {/* card content — same identity as the website hero */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{
              opacity: onCard || stage === 'entering' ? 1 : 0,
              transition: 'opacity 1000ms ease 400ms'
            }}
          >
            <FgMonogram halo="#ead9bf" className="h-16 w-auto text-[#3c0d18] sm:h-20" />
            <p className="mt-3 text-[9px] uppercase tracking-widest2 text-[#7a5c39] sm:text-[10px]">
              The wedding of
            </p>
            <p className="mt-2 font-serif text-xl text-[#3c0d18] sm:text-3xl">{names}</p>
            <div className="mt-3 h-px w-10 bg-[#8a6f52]/70" />
            {dateLine && <p className="mt-3 font-serif text-sm text-[#5c4630] sm:text-base">{dateLine}</p>}
            {venueLine && (
              <p className="mt-1 text-[10px] uppercase tracking-widest2 text-[#7a5c39] sm:text-xs">
                {venueLine}
              </p>
            )}
          </div>
          {/* breathing gold cue around the card once it's clickable */}
          {onCard && (
            <div
              aria-hidden
              className="envelope-breathe pointer-events-none absolute -inset-3 rounded-[4px]"
              style={{ border: '1px solid rgba(201,168,119,0.55)' }}
            />
          )}
        </div>
        </div>

        {/* envelope pocket (front) — two side folds + bottom */}
        <div className="absolute inset-0" style={{ zIndex: 4, pointerEvents: 'none' }}>
          <div
            className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-[3px]"
            style={{
              background: 'linear-gradient(175deg, #3f0e19 0%, #320a12 100%)',
              clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)'
            }}
          />
          <div
            className="absolute inset-y-0 left-0 w-1/2"
            style={{
              background: 'linear-gradient(115deg, #45101c 0%, #380b15 70%)',
              clipPath: 'polygon(0 0, 100% 56%, 0 100%)'
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/2"
            style={{
              background: 'linear-gradient(245deg, #45101c 0%, #380b15 70%)',
              clipPath: 'polygon(100% 0, 0 56%, 100% 100%)'
            }}
          />
          {/* subtle depth at the pocket mouth */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent 55%)' }}
          />
        </div>

        {/* the flap — rotates open around the top edge */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: '56%',
            zIndex: envelopeOpen ? 2 : 6,
            transformOrigin: 'top center',
            transform: `rotateX(${envelopeOpen ? (reduced ? 8 : 172) : 0}deg)`,
            transition: `transform ${TIMING.flapOpenMs}ms ${EASE_LUX}`,
            pointerEvents: 'none',
            backfaceVisibility: 'hidden'
          }}
        >
          <div
            className="h-full w-full"
            style={{
              background: 'linear-gradient(185deg, #4a111e 0%, #3a0d16 90%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              boxShadow: 'inset 0 -1px 0 rgba(240,226,208,0.05)'
            }}
          />
        </div>

        {/* FG seal on the flap — gold, breathing candlelight */}
        <div
          aria-hidden
          className="absolute left-1/2"
          style={{
            top: '30%',
            zIndex: 7,
            transform: `translateX(-50%) translateY(${envelopeOpen ? '-46%' : '0'}) rotateX(${envelopeOpen ? (reduced ? 8 : 172) : 0}deg)`,
            transformOrigin: 'top center',
            transition: `transform ${TIMING.flapOpenMs}ms ${EASE_LUX}, opacity 1000ms ease`,
            opacity: envelopeOpen ? 0 : 1
          }}
        >
          <div className="envelope-breathe rounded-full" style={{ padding: 10 }}>
            <FgMonogram className="h-14 w-auto text-gold sm:h-16" />
          </div>
        </div>
      </div>

      {/* ===================== CUE TEXT ===================== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[10vh] flex flex-col items-center gap-3">
        {/* "YOU ARE CORDIALLY INVITED" — appears in stage 2 */}
        {showInvited && stage === 'sealed' && (
          <p
            className="animate-fade text-[11px] uppercase tracking-widest2 text-clay"
            style={{ animationDuration: '1.2s' }}
          >
            You are cordially invited
          </p>
        )}
        {/* TAP / CLICK cues */}
        {stage === 'sealed' && (
          <p className="cue-fade text-[11px] uppercase tracking-widest2 text-clay/90">
            {isTouch ? 'Tap the envelope to open' : 'Click the envelope to open'}
          </p>
        )}
        {onCard && (
          <p className="cue-fade text-[11px] uppercase tracking-widest2 text-clay/90">
            {isTouch ? 'Tap the invitation to continue' : 'Click the invitation to continue'}
          </p>
        )}
        <div className="h-px w-16 bg-line/50" />
      </div>
    </div>
  )
}
