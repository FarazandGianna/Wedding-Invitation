import { useCallback, useEffect, useRef, useState } from 'react'

export interface LightboxMedia {
  id: string
  alt: string
  isVideo: boolean
  url: string
}

interface Props {
  items: LightboxMedia[]
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * Full-screen lightbox with a smooth backdrop fade and content scale.
 * Opens with a gentle fade and scale-up; closes by reversing the transition.
 * Supports prev/next navigation for both photos and videos.
 */
export default function GalleryLightbox({ items, index, onClose, onNavigate }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  const open = index !== null

  // Mount/unmount with transition delay
  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 450)
      return () => clearTimeout(t)
    }
  }, [open])

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!mounted) return
    const onKey = (e: KeyboardEvent) => {
      // Guard: during the close transition index may be null
      if (index === null) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && items.length > 1) {
        const prev = index <= 0 ? items.length - 1 : index - 1
        onNavigate(prev)
      } else if (e.key === 'ArrowRight' && items.length > 1) {
        const next = index >= items.length - 1 ? 0 : index + 1
        onNavigate(next)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, items.length, index, onClose, onNavigate])

  // Lock body scroll while open
  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose]
  )

  // Touch swipe: left/right to navigate, down to close
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't track swipes that start on video controls
    const target = e.target as HTMLElement
    if (target.tagName === 'VIDEO' && target.hasAttribute('controls')) return
    if (target.closest('button')) return
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current || index === null) return
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStart.current.x
      const dy = t.clientY - touchStart.current.y
      touchStart.current = null

      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      // Swipe down to close (vertical dominant, downward, sufficient distance)
      if (absY > absX && dy > 80) {
        onClose()
        return
      }

      // Swipe left/right to navigate (horizontal dominant, sufficient distance)
      if (absX > absY && absX > 50 && items.length > 1) {
        if (dx > 0) {
          // Swipe right = previous
          onNavigate(index <= 0 ? items.length - 1 : index - 1)
        } else {
          // Swipe left = next
          onNavigate(index >= items.length - 1 ? 0 : index + 1)
        }
      }
    },
    [index, items.length, onClose, onNavigate]
  )

  if (!mounted || index === null) return null

  const media = items[index]
  if (!media) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-ink/80 backdrop-blur-md transition-opacity duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className={`absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-paperDeep/60 text-ink/80 backdrop-blur-sm transition-all duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold/60 hover:bg-paperDeep/80 hover:text-ink ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Prev navigation */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={() => onNavigate(index <= 0 ? items.length - 1 : index - 1)}
          aria-label="Previous"
          className={`absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/30 bg-paperDeep/60 text-ink/80 backdrop-blur-sm transition-all duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold/60 hover:bg-paperDeep/80 hover:text-ink ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Next navigation */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={() => onNavigate(index >= items.length - 1 ? 0 : index + 1)}
          aria-label="Next"
          className={`absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/30 bg-paperDeep/60 text-ink/80 backdrop-blur-sm transition-all duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold/60 hover:bg-paperDeep/80 hover:text-ink ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Media */}
      <div
        className={`relative px-4 py-8 transition-all duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-16 ${
          visible
            ? 'scale-100 opacity-100'
            : 'scale-[0.96] opacity-0'
        }`}
      >
        {media.isVideo ? (
          <video
            key={media.id}
            src={media.url}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="max-h-[82vh] max-w-[92vw] h-auto w-auto rounded-2xl object-contain"
          />
        ) : (
          <img
            key={media.id}
            src={media.url}
            alt={media.alt}
            className="max-h-[82vh] max-w-[92vw] h-auto w-auto rounded-2xl object-contain"
          />
        )}

        {/* Caption */}
        <p className="mt-4 text-center text-xs uppercase tracking-widest2 text-clay/80">
          {index + 1} / {items.length}
        </p>
      </div>
    </div>
  )
}
