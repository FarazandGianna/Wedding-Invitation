/**
 * Three-stage first-open experience: sealed envelope → opened envelope with
 * invitation card → transition into the real website.
 *
 * Everything uses the site's existing palette only (wine paper, warm gold,
 * ink cream) and the ONE canonical FG monogram. Motion is slow and soft:
 * no bounce, no spin, no particles. `prefers-reduced-motion` collapses the
 * transforms and keeps the same three-beat flow.
 *
 * The invitation card (stage 2) only appears once the real database record
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
  flapOpenMs: 1400, // flap lift after click 1
  cardRiseMs: 1600, // card emerges after the flap
  enterMs: 1200 // card → website dissolve after click 2
}

const EASE_LUX = 'cubic-bezier(0.33, 0.02, 0.2, 1)' // soft, expensive feel

const isTouch =
  typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

export default function EnvelopeIntro({ invitation, onFinished }: Props) {
  const [stage, setStage] = useState<Stage>('sealed')
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

  const openEnvelope = useCallback(() => {
    if (stage !== 'sealed') return
    setStage('opening')
  }, [stage])

  // The card rises only once the flap is open AND the data is ready — if the
  // network is slow the guest simply sees the open envelope a beat longer.
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
      style={{ perspective: '1200px' }}
    >
      {/* Soft atmospheric depth: one faint gold ambiance behind the envelope */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(closest-side, rgba(201,168,119,0.10), transparent 70%)',
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
          // Stage 2: the open envelope recedes — scales down and drops back
          // (translateZ) so the risen card reads as the hero in front, with
          // the envelope peeking out behind it, like reference image 4.
          transform:
            stage === 'entering'
              ? 'translateZ(-90px) scale(0.98)'
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
            transition: 'opacity 700ms ease'
          }}
        />

        {/* Card slide wrapper: clips the card to the envelope's bounds while
            sealed/opening so nothing can leak out; unclips (and lifts above
            the pocket) at the card stage so the risen card is fully visible. */}
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
            // SEALED: tucked inside, top just below the envelope top (clipped
            // by the wrapper, covered by flap + pocket). CARD: settles at the
            // viewport center while the envelope glides down behind it.
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
          {/* card content — same identity as the website hero */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{
              opacity: onCard || stage === 'entering' ? 1 : 0,
              transition: 'opacity 900ms ease 300ms'
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

        {/* envelope pocket (front) — two side folds + bottom, above the card */}
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
              // 56% edge matches the flap's hypotenuse exactly, so fold and
              // flap meet with no gap for the card to peek through.
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
            transform: `rotateX(${envelopeOpen ? (reduced ? 8 : 168) : 0}deg)`,
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

        {/* FG seal on the flap — moves with it, gold, breathing candlelight */}
        <div
          aria-hidden
          className="absolute left-1/2"
          style={{
            top: '30%',
            zIndex: 7,
            transform: `translateX(-50%) translateY(${envelopeOpen ? '-46%' : '0'}) rotateX(${envelopeOpen ? (reduced ? 8 : 168) : 0}deg)`,
            transformOrigin: 'top center',
            transition: `transform ${TIMING.flapOpenMs}ms ${EASE_LUX}, opacity 900ms ease`,
            opacity: envelopeOpen ? 0 : 1
          }}
        >
          <div className="envelope-breathe rounded-full" style={{ padding: 10 }}>
            <FgMonogram className="h-14 w-auto text-gold sm:h-16" />
          </div>
        </div>
      </div>

      {/* ===================== CUE TEXT ===================== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[12vh] flex flex-col items-center gap-3">
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
