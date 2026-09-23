/**
 * Four-stage first-open experience matching the reference storyboard:
 *   1. Sealed horizontal envelope with gold monogram seal on the flap tip
 *   2. "YOU ARE CORDIALLY INVITED" appears below with flourishes above & below
 *   3. Click → flap opens upward, card rises out from inside
 *   4. Click card → dissolves into the real website
 *
 * The card only appears once the real DB record has loaded.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Invitation } from '../types/invitation'
import { formatEventDate } from '../utils/format'
import FgMonogram from './FgMonogram'

interface Props {
  invitation: Invitation | null
  onFinished: () => void
}

type Stage = 'sealed' | 'opening' | 'card' | 'entering'

const TIMING = {
  flapOpenMs: 1600,
  cardRiseMs: 1800,
  enterMs: 1400
}

const EASE_LUX = 'cubic-bezier(0.33, 0.02, 0.2, 1)'

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

  useEffect(() => {
    after(reduced ? 200 : 1200, () => setShowInvited(true))
  }, [reduced, after])

  const openEnvelope = useCallback(() => {
    if (stage !== 'sealed') return
    setShowInvited(false)
    setStage('opening')
  }, [stage])

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-paper"
      role="dialog"
      aria-label="Wedding invitation"
      style={{ perspective: '1400px' }}
    >
      {/* ======================== SCENE DECORATION (matches reference) ======================== */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        {/* Vignette — darken edges to focus center */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 30%, rgba(20,4,8,0.5) 80%, rgba(10,2,4,0.85) 100%)' }} />

        {/* Top-center spotlight illuminating the envelope */}
        <div className="absolute left-1/2 top-0 h-[55vh] w-[70vw] -translate-x-1/2" style={{ background: 'radial-gradient(ellipse 50% 70% at 50% 0%, rgba(201,168,119,0.18) 0%, rgba(201,168,119,0.06) 35%, transparent 70%)' }} />

        {/* Bottom reflective surface */}
        <div className="absolute bottom-0 left-0 right-0 h-[35vh]" style={{ background: 'linear-gradient(to top, rgba(15,3,6,0.7) 0%, rgba(30,8,16,0.4) 30%, transparent 100%)' }} />
        {/* Warm reflection glow under envelope */}
        <div className="absolute left-1/2 bottom-[6vh] h-[8vh] w-[50vw] -translate-x-1/2 rounded-[50%]" style={{ background: 'radial-gradient(closest-side, rgba(201,168,119,0.08), transparent 80%)', filter: 'blur(12px)' }} />

        {/* Golden bokeh particles near floral areas */}
        <div className="absolute left-[6%] top-[10%] h-3.5 w-3.5 rounded-full" style={{ background: 'rgba(201,168,119,0.5)', filter: 'blur(4px)', opacity: 0.25 }} />
        <div className="absolute left-[14%] top-[22%] h-2 w-2 rounded-full" style={{ background: 'rgba(201,168,119,0.5)', filter: 'blur(3px)', opacity: 0.18 }} />
        <div className="absolute left-[4%] top-[32%] h-1.5 w-1.5 rounded-full" style={{ background: 'rgba(201,168,119,0.5)', filter: 'blur(2px)', opacity: 0.12 }} />
        <div className="absolute right-[7%] top-[12%] h-4 w-4 rounded-full" style={{ background: 'rgba(201,168,119,0.5)', filter: 'blur(5px)', opacity: 0.22 }} />
        <div className="absolute right-[15%] top-[26%] h-2 w-2 rounded-full" style={{ background: 'rgba(201,168,119,0.5)', filter: 'blur(3px)', opacity: 0.16 }} />
        <div className="absolute right-[5%] top-[38%] h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(201,168,119,0.5)', filter: 'blur(3px)', opacity: 0.14 }} />

        {/* Floral arrangement — top-left corner (burgundy roses + baby's breath) */}
        <svg className="absolute -left-6 -top-6 h-44 w-44 opacity-70" viewBox="0 0 200 200" fill="none" aria-hidden>
          <circle cx="38" cy="48" r="24" fill="#4a0d18" />
          <circle cx="38" cy="48" r="18" fill="#5a1020" />
          <circle cx="38" cy="48" r="12" fill="#6a1525" />
          <circle cx="38" cy="48" r="6" fill="#7a1a2a" opacity="0.7" />
          <circle cx="68" cy="32" r="17" fill="#3a0a14" />
          <circle cx="68" cy="32" r="12" fill="#4a0d18" />
          <circle cx="68" cy="32" r="7" fill="#5a1020" />
          <circle cx="22" cy="78" r="15" fill="#3a0a14" />
          <circle cx="22" cy="78" r="10" fill="#4a0d18" />
          <circle cx="22" cy="78" r="6" fill="#5a1020" />
          <circle cx="85" cy="50" r="2.5" fill="#e8d5b8" opacity="0.65" />
          <circle cx="92" cy="42" r="2" fill="#e8d5b8" opacity="0.55" />
          <circle cx="88" cy="60" r="2" fill="#e8d5b8" opacity="0.5" />
          <circle cx="95" cy="55" r="1.5" fill="#e8d5b8" opacity="0.6" />
          <circle cx="100" cy="48" r="1.5" fill="#e8d5b8" opacity="0.45" />
          <circle cx="78" cy="68" r="1.5" fill="#e8d5b8" opacity="0.4" />
          <circle cx="10" cy="100" r="2" fill="#e8d5b8" opacity="0.5" />
          <circle cx="18" cy="108" r="1.5" fill="#e8d5b8" opacity="0.4" />
          <circle cx="5" cy="90" r="1.5" fill="#e8d5b8" opacity="0.35" />
          <path d="M52 72 Q 62 82 68 92" stroke="#2a1a0e" strokeWidth="1.2" opacity="0.4" fill="none" />
          <path d="M48 78 Q 42 88 38 98" stroke="#2a1a0e" strokeWidth="1" opacity="0.35" fill="none" />
          <path d="M58 85 Q 55 95 52 105" stroke="#2a1a0e" strokeWidth="0.8" opacity="0.3" fill="none" />
        </svg>

        {/* Floral arrangement — top-right corner (mirror) */}
        <svg className="absolute -right-6 -top-6 h-44 w-44 opacity-70" viewBox="0 0 200 200" fill="none" aria-hidden style={{ transform: 'scaleX(-1)' }}>
          <circle cx="38" cy="48" r="24" fill="#4a0d18" />
          <circle cx="38" cy="48" r="18" fill="#5a1020" />
          <circle cx="38" cy="48" r="12" fill="#6a1525" />
          <circle cx="38" cy="48" r="6" fill="#7a1a2a" opacity="0.7" />
          <circle cx="68" cy="32" r="17" fill="#3a0a14" />
          <circle cx="68" cy="32" r="12" fill="#4a0d18" />
          <circle cx="68" cy="32" r="7" fill="#5a1020" />
          <circle cx="22" cy="78" r="15" fill="#3a0a14" />
          <circle cx="22" cy="78" r="10" fill="#4a0d18" />
          <circle cx="22" cy="78" r="6" fill="#5a1020" />
          <circle cx="85" cy="50" r="2.5" fill="#e8d5b8" opacity="0.65" />
          <circle cx="92" cy="42" r="2" fill="#e8d5b8" opacity="0.55" />
          <circle cx="88" cy="60" r="2" fill="#e8d5b8" opacity="0.5" />
          <circle cx="95" cy="55" r="1.5" fill="#e8d5b8" opacity="0.6" />
          <circle cx="100" cy="48" r="1.5" fill="#e8d5b8" opacity="0.45" />
          <circle cx="78" cy="68" r="1.5" fill="#e8d5b8" opacity="0.4" />
          <circle cx="10" cy="100" r="2" fill="#e8d5b8" opacity="0.5" />
          <circle cx="18" cy="108" r="1.5" fill="#e8d5b8" opacity="0.4" />
          <circle cx="5" cy="90" r="1.5" fill="#e8d5b8" opacity="0.35" />
          <path d="M52 72 Q 62 82 68 92" stroke="#2a1a0e" strokeWidth="1.2" opacity="0.4" fill="none" />
          <path d="M48 78 Q 42 88 38 98" stroke="#2a1a0e" strokeWidth="1" opacity="0.35" fill="none" />
          <path d="M58 85 Q 55 95 52 105" stroke="#2a1a0e" strokeWidth="0.8" opacity="0.3" fill="none" />
        </svg>

        {/* Center glow that fades when entering site */}
        <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(201,168,119,0.12), transparent 70%)', opacity: stage === 'entering' ? 0 : 1, transition: `opacity ${TIMING.enterMs}ms ease` }} />
      </div>

      {/* ======================== ENVELOPE + CARD ======================== */}
      <div
        className="relative z-10 select-none"
        style={{
          width: 'min(82vw, 440px)',
          /* Horizontal envelope ~1.6:1 */
          aspectRatio: '8 / 5',
          transform:
            stage === 'entering'
              ? 'translateZ(-90px) scale(0.96)'
              : onCard
                ? 'translateZ(-60px) scale(0.98)'
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
        {/* Envelope body (back panel) */}
        <div
          className="absolute inset-0 rounded-[3px]"
          style={{
            background: 'linear-gradient(160deg, #43101c 0%, #360b14 55%, #2d0911 100%)',
            boxShadow: '0 24px 60px -18px rgba(0,0,0,0.65), inset 0 1px 0 rgba(240,226,208,0.06)'
          }}
        />

        {/* Inner lining (visible once flap opens) */}
        <div
          className="absolute inset-x-[3%] top-[4%] bottom-[3%] rounded-[2px]"
          style={{
            background: 'linear-gradient(175deg, #47131f 0%, #3a0d17 100%)',
            opacity: envelopeOpen ? 1 : 0,
            transition: 'opacity 900ms ease'
          }}
        />

        {/* Card wrapper: clips card while sealed, unclips when card rises */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: onCard || stage === 'entering' ? 5 : 3,
            overflow: onCard || stage === 'entering' ? 'visible' : 'hidden'
          }}
        >
          {/* The invitation card — portrait, slides up from inside */}
          <div
            className="absolute left-1/2 rounded-[2px]"
            style={{
              width: '70%',
              height: '140%',
              bottom: '3%',
              transform: `translateX(-50%) translateY(${onCard || stage === 'entering' ? '3%' : '47%'}) scale(${stage === 'entering' ? 1.05 : 1})`,
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
            {/* Card paper */}
            <div
              className="absolute inset-0 rounded-[2px] border border-line/60"
              style={{
                background: 'linear-gradient(170deg, #f3e7d3 0%, #ead9bf 60%, #e2cfae 100%)',
                boxShadow: '0 -10px 40px -12px rgba(0,0,0,0.55)',
                opacity: envelopeOpen ? 1 : 0,
                transition: 'opacity 800ms ease 300ms'
              }}
            />
            {/* Ornate corner flourishes on the card */}
            <div className="pointer-events-none absolute inset-0" aria-hidden style={{ opacity: envelopeOpen ? 1 : 0, transition: 'opacity 800ms ease 300ms' }}>
              <svg className="absolute left-2 top-2 h-8 w-8 text-[#8a6f52]/50" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="0.8">
                <path d="M2 2 C 12 2, 16 6, 18 14 C 14 8, 8 6, 2 6" />
                <path d="M2 2 C 2 8, 4 12, 10 14 C 6 10, 4 6, 2 2" opacity="0.6" />
              </svg>
              <svg className="absolute right-2 top-2 h-8 w-8 text-[#8a6f52]/50" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="0.8">
                <path d="M30 2 C 20 2, 16 6, 14 14 C 18 8, 24 6, 30 6" />
                <path d="M30 2 C 30 8, 28 12, 22 14 C 26 10, 28 6, 30 2" opacity="0.6" />
              </svg>
              <svg className="absolute bottom-2 left-2 h-8 w-8 text-[#8a6f52]/50" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="0.8">
                <path d="M2 30 C 12 30, 16 26, 18 18 C 14 24, 8 26, 2 26" />
                <path d="M2 30 C 2 24, 4 20, 10 18 C 6 22, 4 26, 2 30" opacity="0.6" />
              </svg>
              <svg className="absolute bottom-2 right-2 h-8 w-8 text-[#8a6f52]/50" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="0.8">
                <path d="M30 30 C 20 30, 16 26, 14 18 C 18 24, 24 26, 30 26" />
                <path d="M30 30 C 30 24, 28 20, 22 18 C 26 22, 28 26, 30 30" opacity="0.6" />
              </svg>
            </div>
            {/* Card content */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={{
                opacity: onCard || stage === 'entering' ? 1 : 0,
                transition: 'opacity 1000ms ease 400ms'
              }}
            >
              <FgMonogram halo="#ead9bf" className="h-20 w-auto sm:h-24" />
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
            {/* Breathing gold cue when card is clickable */}
            {onCard && (
              <div
                aria-hidden
                className="envelope-breathe pointer-events-none absolute -inset-3 rounded-[4px]"
                style={{ border: '1px solid rgba(201,168,119,0.55)' }}
              />
            )}
          </div>
        </div>

        {/* Envelope pocket (front) — side folds + bottom */}
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
          <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent 55%)' }}
          />
        </div>

        {/* The flap — V-shape pointing down when closed, rotates up when opened */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: '55%',
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

        {/* Gold monogram seal — centered on the flap tip when closed */}
        <div
          aria-hidden
          className="absolute left-1/2"
          style={{
            top: '40%',
            zIndex: 7,
            transform: `translateX(-50%) translateY(${envelopeOpen ? '-46%' : '0'}) rotateX(${envelopeOpen ? (reduced ? 8 : 172) : 0}deg)`,
            transformOrigin: 'top center',
            transition: `transform ${TIMING.flapOpenMs}ms ${EASE_LUX}, opacity 1000ms ease`,
            opacity: envelopeOpen ? 0 : 1
          }}
        >
          <div className="envelope-breathe rounded-full" style={{ padding: 10, background: 'radial-gradient(circle, rgba(201,168,119,0.12) 0%, transparent 70%)' }}>
            <FgMonogram className="h-16 w-auto sm:h-20" />
          </div>
        </div>
      </div>

      {/* ===================== BELOW THE ENVELOPE ===================== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[10vh] z-10 flex flex-col items-center gap-3">
        {/* "YOU ARE CORDIALLY INVITED" with flourishes ABOVE and BELOW */}
        {showInvited && stage === 'sealed' && (
          <div className="animate-fade flex flex-col items-center gap-2" style={{ animationDuration: '1.2s' }}>
            {/* Top flourish */}
            <svg width="120" height="12" viewBox="0 0 120 12" fill="none" stroke="currentColor" className="text-clay/50">
              <path d="M0 6 C 20 6, 30 2, 50 6 C 60 8, 70 6, 90 6 C 100 6, 110 4, 120 6" strokeWidth="0.8" />
              <circle cx="60" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <path d="M50 6 C 52 3, 54 3, 56 6 C 54 9, 52 9, 50 6" strokeWidth="0.6" />
              <path d="M64 6 C 66 3, 68 3, 70 6 C 68 9, 66 9, 64 6" strokeWidth="0.6" />
            </svg>
            <p className="text-sm font-serif uppercase tracking-widest2 text-clay sm:text-base">
              You are cordially invited
            </p>
            {/* Bottom flourish (mirror) */}
            <svg width="120" height="12" viewBox="0 0 120 12" fill="none" stroke="currentColor" className="text-clay/50">
              <path d="M0 6 C 20 6, 30 10, 50 6 C 60 4, 70 6, 90 6 C 100 6, 110 8, 120 6" strokeWidth="0.8" />
              <circle cx="60" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <path d="M50 6 C 52 3, 54 3, 56 6 C 54 9, 52 9, 50 6" strokeWidth="0.6" />
              <path d="M64 6 C 66 3, 68 3, 70 6 C 68 9, 66 9, 64 6" strokeWidth="0.6" />
            </svg>
          </div>
        )}

        {/* Tap/click cues */}
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
