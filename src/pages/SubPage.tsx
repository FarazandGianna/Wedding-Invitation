import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FgMonogram from '../components/FgMonogram'
import Nav from '../components/Nav'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { isSectionEnabled, useInvitation } from '../hooks/useInvitation'
import { applyInvitationMeta } from '../utils/meta'
import type { Invitation, GalleryItem, WeddingEvent, RegistryItem, PageSettings, PageItem, FaqItem } from '../types/invitation'
import NotFoundPage from './NotFound'

export interface SubPageData {
  invitation: Invitation
  sections: Record<string, boolean>
  gallery: GalleryItem[]
  events: WeddingEvent[]
  registry: RegistryItem[]
  pageSettings: PageSettings[]
  pageItems: PageItem[]
  faqItems: FaqItem[]
}

interface SubPageLayoutProps {
  children: (data: SubPageData) => React.ReactNode
}

// Shared wrapper for sub-pages (Details, Venue, FAQ): loads the invitation,
// handles loading/error/not-found states, renders nav + back button.
export default function SubPageLayout({ children }: SubPageLayoutProps) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const state = useInvitation(slug)

  useEffect(() => {
    if (state.status === 'ready') applyInvitationMeta(state.invitation)
  }, [state])

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <p className="text-xs uppercase tracking-widest2 text-clay">One moment</p>
        <h1 className="mt-4 font-serif text-2xl text-ink">This invitation isn't set up yet</h1>
      </div>
    )
  }

  if (state.status === 'not-found') return <NotFoundPage />

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <p className="text-xs uppercase tracking-widest2 text-clay">Something went wrong</p>
        <h1 className="mt-4 font-serif text-2xl text-ink">We couldn't load this page</h1>
      </div>
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <FgMonogram className="h-24 w-auto animate-pulse" />
      </div>
    )
  }

  const ready = state.status === 'ready'

  // Build nav items matching the main page
  const navItems = ready
    ? ([
        ...state.pageSettings
          .filter((ps) => ps.is_enabled)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((ps) => ({
            label: ps.button_label || (ps.page_type === 'faq' ? 'FAQ' : ps.page_type.charAt(0).toUpperCase() + ps.page_type.slice(1)),
            route: ps.page_type as string | undefined,
            targetId: undefined as string | undefined
          })),
        isSectionEnabled(state.sections, 'gallery') && state.gallery.length > 0 && { label: 'Gallery', route: 'gallery', targetId: undefined },
        isSectionEnabled(state.sections, 'rsvp') && { label: 'RSVP', route: undefined, targetId: 'rsvp' }
      ].filter(Boolean) as { label: string; route?: string; targetId?: string }[])
    : []

  return (
    <div className="min-h-screen bg-paper">
      <Nav items={navItems} slug={slug} />
      <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <button
          type="button"
          onClick={() => navigate(`/invite/${slug}`)}
          className="mb-8 text-xs uppercase tracking-widest2 text-clay transition-colors hover:text-ink"
        >
          ← Back to invitation
        </button>
        {ready && children({
          invitation: state.invitation,
          sections: state.sections,
          gallery: state.gallery,
          events: state.events,
          registry: state.registry,
          pageSettings: state.pageSettings,
          pageItems: state.pageItems,
          faqItems: state.faqItems
        })}
      </div>
    </div>
  )
}
