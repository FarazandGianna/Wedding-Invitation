import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { GalleryItem, PageSettings } from '../types/invitation'
import SubPageLayout from './SubPage'

interface GalleryMedia {
  id: string
  alt: string
  isVideo: boolean
  url: string
}

function resolveMediaUrl(item: GalleryItem): string {
  return (
    item.image_url ||
    supabase.storage.from('gallery').getPublicUrl(item.storage_path).data.publicUrl
  )
}

function MediaTile({
  media,
  featured,
  selected,
  onClick,
}: {
  media: GalleryMedia
  featured?: boolean
  selected?: boolean
  onClick?: () => void
}) {
  const baseClass = 'relative h-full w-full overflow-hidden bg-paperDeep/50'
  const clickProps = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        },
      }
    : {}

  return (
    <div
      className={`${baseClass} ${onClick ? 'cursor-pointer' : ''} ${
        selected ? 'ring-2 ring-gold ring-offset-2 ring-offset-paper' : ''
      }`}
      {...clickProps}
    >
      {media.isVideo ? (
        featured ? (
          <video
            src={media.url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
          />
        ) : (
          <>
            <video
              src={media.url}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-paper/30">
              <svg
                className="h-8 w-8 text-ink/80"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </>
        )
      ) : (
        <img
          src={media.url}
          alt={media.alt}
          loading={featured ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-contain"
        />
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
  const [featuredId, setFeaturedId] = useState<string | null>(null)

  const gallerySetting = pageSettings.find((ps) => ps.page_type === 'gallery')
  const pageTitle = gallerySetting?.page_title || 'Gallery'
  const pageSubtitle = gallerySetting?.page_subtitle || 'A glimpse of our moments together.'

  const photos = useMemo<GalleryMedia[]>(
    () =>
      gallery.map((item) => ({
        id: item.id,
        alt: item.alt_text || 'Wedding photo',
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
            Gallery coming soon — check back after the celebration.
          </p>
        </div>
      </div>
    )
  }

  const featured = sorted.find((m) => m.id === featuredId) || sorted[0]
  const thumbnails = sorted.filter((m) => m.id !== featured.id)
  const hasMultipleRows = thumbnails.length > 3

  return (
    <div>
      <p className="text-center text-xs uppercase tracking-widest2 text-clay">
        {pageTitle}
      </p>
      {pageSubtitle && (
        <p className="mt-3 text-center text-sm text-ink/60">{pageSubtitle}</p>
      )}

      <div className="mx-auto mt-8 max-w-4xl">
        {thumbnails.length === 0 ? (
          <div className="overflow-hidden bg-paperDeep/50">
            <div className="aspect-[16/10] sm:aspect-[16/9]">
              <MediaTile media={featured} featured />
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:gap-3 md:grid-cols-6 md:auto-rows-[140px]">
            <div className="col-span-2 aspect-[4/3] md:col-span-4 md:row-span-3 md:aspect-auto">
              <MediaTile media={featured} featured />
            </div>
            {thumbnails.slice(0, 3).map((media) => (
              <div
                key={media.id}
                className="col-span-1 aspect-square md:col-span-2 md:row-span-1 md:aspect-auto"
              >
                <MediaTile
                  media={media}
                  selected={media.id === featured.id}
                  onClick={() => setFeaturedId(media.id)}
                />
              </div>
            ))}
            {hasMultipleRows &&
              thumbnails.slice(3, 7).map((media) => (
                <div
                  key={media.id}
                  className="col-span-1 aspect-square md:col-span-2 md:row-span-1 md:aspect-auto"
                >
                  <MediaTile
                    media={media}
                    selected={media.id === featured.id}
                    onClick={() => setFeaturedId(media.id)}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
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
