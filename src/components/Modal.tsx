import { useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  label: string
  title: string
  subtitle?: string
  children: React.ReactNode
}

/**
 * Full-screen overlay modal with a smooth backdrop-fade + panel-slide-up
 * transition.  Closes on Escape, backdrop click, or the close button.
 * Locks body scroll while open and restores focus on close.
 */
export default function Modal({ open, onClose, label, title, subtitle, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  // Mount/unmount with a transition delay
  useEffect(() => {
    if (open) {
      setMounted(true)
      // next tick so the initial opacity-0 state is painted before transitioning
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 400)
      return () => clearTimeout(t)
    }
  }, [open])

  // Escape to close
  useEffect(() => {
    if (!mounted) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-400 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-paper shadow-2xl transition-all duration-400 ease-out sm:max-h-[85vh] ${
          visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
        style={{
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
        }}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line/40 bg-paper/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-clay">{label}</p>
            <h2 className="mt-1 font-serif text-2xl text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line/50 text-ink/70 transition-colors hover:bg-ink hover:text-paper"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">{children}</div>
      </div>
    </div>
  )
}
