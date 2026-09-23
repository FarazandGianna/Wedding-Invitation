import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { GalleryItem } from '../types/invitation'

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
  const baseClass = 'relative h-full w-full overflow-hidden bg-line/30'
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
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <video
              src={media.url}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
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
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      )}
    </div>
  )
}

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const [featuredId, setFeaturedId] = useState<string | null>(null)

  const photos = useMemo<GalleryMedia[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        alt: item.alt_text || 'Wedding photo',
        isVideo: (item.content_type || '').startsWith('video/'),
        url: resolveMediaUrl(item),
      })),
    [items]
  )

  // Sort by sort_order, then by original order
  const sorted = useMemo(() => {
    return [...items]
      .map((item, i) => ({ item, media: photos[i], sortIndex: i }))
      .sort((a, b) => a.item.sort_order - b.item.sort_order)
      .map((x) => x.media)
  }, [items, photos])

  if (sorted.length === 0) return null

  // Determine featured item: user-selected, or first by sort order
  const featured =
    sorted.find((m) => m.id === featuredId) || sorted[0]

  // Thumbnails = everything except the featured item
  const thumbnails = sorted.filter((m) => m.id !== featured.id)

  // Different layouts based on count
  const hasMultipleRows = thumbnails.length > 3

  return (
    <section id="gallery" className="px-6 py-20 sm:py-28">
      <p className="text-center text-xs uppercase tracking-widest2 text-clay">Gallery</p>

      <div className="mx-auto mt-8 max-w-4xl">
        {thumbnails.length === 0 ? (
          // Single item — just show it large
          <div className="overflow-hidden rounded-lg bg-line/30">
            <div className="aspect-[16/10] sm:aspect-[16/9]">
              <MediaTile media={featured} featured />
            </div>
          </div>
        ) : (
          // Bento-style layout
          <div className="grid gap-2 sm:gap-3 md:grid-cols-6 md:auto-rows-[120px]">
            {/* Featured item — large, spans 4 cols and 3 rows on desktop */}
            <div className="col-span-2 aspect-[4/3] md:col-span-4 md:row-span-3 md:aspect-auto">
              <MediaTile media={featured} featured />
            </div>

            {/* Right column thumbnails — stack vertically next to featured */}
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

            {/* Bottom row thumbnails — fill remaining space */}
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
    </section>
  )
}
