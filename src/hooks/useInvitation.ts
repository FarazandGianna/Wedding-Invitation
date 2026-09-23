import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { GalleryItem, Invitation, InvitationSection } from '../types/invitation'

// Only the public-facing columns are selected — nothing admin-only lives on
// this table, but keeping an explicit column list documents intent and
// prevents an accidental `select('*')` from leaking new sensitive columns
// added later.
const INVITATION_COLUMNS = [
  'id', 'slug', 'is_published', 'bride_name', 'groom_name', 'invitation_title',
  'invitation_message', 'wedding_date', 'wedding_time', 'timezone',
  'venue_name', 'venue_address', 'map_url', 'contact_name', 'contact_phone',
  'rsvp_enabled', 'rsvp_deadline', 'max_guests_per_rsvp', 'og_image_url'
].join(', ')

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      invitation: Invitation
      sections: Record<string, boolean>
      gallery: GalleryItem[]
    }

export function useInvitation(slug: string | undefined) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    if (!slug) {
      setState({ status: 'not-found' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    async function load() {
      const { data: invitation, error: invError } = await supabase
        .from('invitations')
        .select(INVITATION_COLUMNS)
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle<Invitation>()

      if (cancelled) return

      if (invError) {
        setState({ status: 'error', message: invError.message })
        return
      }
      if (!invitation) {
        setState({ status: 'not-found' })
        return
      }

      const [{ data: sectionRows }, { data: galleryRows }] = await Promise.all([
        supabase
          .from('invitation_sections')
          .select('section_key, is_enabled, sort_order')
          .eq('invitation_id', invitation.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('gallery_items')
          .select('id, invitation_id, storage_path, alt_text, sort_order')
          .eq('invitation_id', invitation.id)
          .order('sort_order', { ascending: true })
      ])

      if (cancelled) return

      const sections: Record<string, boolean> = {}
      for (const row of (sectionRows ?? []) as Pick<InvitationSection, 'section_key' | 'is_enabled'>[]) {
        sections[row.section_key] = row.is_enabled
      }

      setState({
        status: 'ready',
        invitation,
        sections,
        gallery: (galleryRows ?? []) as GalleryItem[]
      })
    }

    load().catch((err) => {
      if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
    })

    return () => {
      cancelled = true
    }
  }, [slug])

  return state
}

export function isSectionEnabled(sections: Record<string, boolean>, key: string) {
  // Default to enabled if no explicit row exists, so the site still works
  // before an admin has configured section rows.
  return sections[key] ?? true
}
