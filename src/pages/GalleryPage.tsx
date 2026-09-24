import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { GalleryItem, PageSettings } from '../types/invitation'
import SubPageLayout from './SubPage'
import GalleryLightbox, { type LightboxMedia } from '../components/GalleryLightbox'

interface GalleryMedia {
  id: string
  alt: string
  title: string | null
  isVideo: boolean
  url: string
}

function resolveMediaUrl(item: GalleryItem): string {
  return (
    item.image_url ||
    supabase.storage.from('gallery').getPublicUrl(item.storage_path).data.publicUrl
  )
}

function MediaCard({
  media,
  onClick,
}: {
  media: GalleryMedia
  onClick: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="group mb-3 inline-block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-2xl border border-line/10 bg-paperDeep/40 p-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] hover:border-gold/25 hover:bg-paperDeep/60 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] focus:outline-none focus-visible:border-gold/40"
    >
      <div className="relative overflow-hidden rounded-xl">
        {media.isVideo ? (
          <>
            <video
              src={media.url}
              muted
              playsInline
              preload="metadata"
              className="block w-full h-auto rounded-xl"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/20 transition-opacity duration-500 group-hover:opacity-0">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-paperDeep/70 backdrop-blur-sm">
                <svg
                  className="h-5 w-5 text-ink/90"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          </>
        ) : (
          <img
            src={media.url}
            alt={media.alt}
            loading="lazy"
            decoding="async"
            className="block w-full h-auto rounded-xl"
          />
        )}
      </div>
      {media.title && (
        <p className="mt-2 px-1 text-center font-serif text-sm text-ink/70">
          {media.title}
        </p>
      )}
    </div>
  )
}

function GalleryContent({
  gallery,
  pageSettings,
}: {
  gallery: GalleryItem[]
  pageSettings: PageSettings[]
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const gallerySetting = pageSettings.find((ps) => ps.page_type === 'gallery')
  const pageTitle = gallerySetting?.page_title || 'Gallery'
  const pageSubtitle = gallerySetting?.page_subtitle || 'A glimpse of our moments together.'

  const photos = useMemo<GalleryMedia[]>(
    () =>
      gallery.map((item) => ({
        id: item.id,
        alt: item.alt_text || 'Wedding photo',
        title: item.title,
        isVideo: (item.content_type || '').startsWith('video/'),
        url: resolveMediaUrl(item),
      })),
    [gallery]
  )

  const sorted = useMemo(() => {
    return [...gallery]
      .map((item, i) => ({ item, media: photos[i] }))
      .sort((a, b) => a.item.sort_order - b.item.sort_order)
      .map((x) => x.media)
  }, [gallery, photos])

  if (sorted.length === 0) {
    return (
      <div>
        <p className="text-center text-xs uppercase tracking-widest2 text-clay">
          {pageTitle}
        </p>
        {pageSubtitle && (
          <p className="mt-3 text-center text-sm text-ink/60">{pageSubtitle}</p>
        )}
        <div className="mt-12 text-center">
          <p className="font-serif text-lg text-ink/50">
            Gallery coming soon. Check back after the celebration.
          </p>
        </div>
      </div>
    )
  }

  const lightboxItems: LightboxMedia[] = sorted

  return (
    <div>
      <p className="text-center text-xs uppercase tracking-widest2 text-clay">
        {pageTitle}
      </p>
      {pageSubtitle && (
        <p className="mt-3 text-center text-sm text-ink/60">{pageSubtitle}</p>
      )}

      <div className="mx-auto mt-8 max-w-4xl">
        {sorted.length === 1 ? (
          // Single item: center it instead of left-aligning in a column
          <div className="mx-auto max-w-md">
            <MediaCard
              key={sorted[0].id}
              media={sorted[0]}
              onClick={() => setLightboxIndex(0)}
            />
          </div>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 sm:gap-4">
            {sorted.map((media, i) => (
              <MediaCard
                key={media.id}
                media={media}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      <GalleryLightbox
        items={lightboxItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  )
}

export default function GalleryPage() {
  return (
    <SubPageLayout>
      {({ gallery, pageSettings }) => (
        <GalleryContent gallery={gallery} pageSettings={pageSettings} />
      )}
    </SubPageLayout>
  )
}
