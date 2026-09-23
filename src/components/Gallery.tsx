import { useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { GalleryItem } from '../types/invitation'

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const photos = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        alt: item.alt_text || 'Wedding photo',
        // Admin-added items carry a direct image_url; bucket items resolve
        // through storage.
        url:
          item.image_url ||
          supabase.storage.from('gallery').getPublicUrl(item.storage_path).data.publicUrl
      })),
    [items]
  )

  if (photos.length === 0) return null

  return (
    <section id="gallery" className="px-6 py-20 sm:py-28">
      <p className="text-center text-xs uppercase tracking-widest2 text-clay">Gallery</p>
      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {photos.map((photo, i) => (
          <div key={photo.id} className="aspect-[3/4] overflow-hidden bg-line/40">
            <img
              src={photo.url}
              alt={photo.alt}
              loading={i < 3 ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
