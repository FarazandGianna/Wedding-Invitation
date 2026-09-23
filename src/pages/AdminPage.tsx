import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type {
  AdminRsvpRow,
  AdminSummary,
  AdminWeddingEvent,
  AdminRegistryItem,
  AdminPageItem,
  AdminFaqItem,
  Invitation,
  PageSettings,
  SectionKey
} from '../types/invitation'

type Tab = 'guests' | 'details' | 'sections' | 'gallery' | 'events' | 'registry' | 'pages' | 'detail-items' | 'venue-items' | 'faq'

const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero (names + date)',
  couple: 'Couple intro',
  message: 'Couple message',
  countdown: 'Countdown',
  details: 'Details (when/contact)',
  venue: 'Venue (where/map)',
  gallery: 'Gallery',
  itinerary: 'Itinerary (Pakistan events)',
  rsvp: 'RSVP form',
  registry: 'Wedding registry',
  contact: 'Contact',
  footer: 'Footer'
}

const PASSCODE_KEY = 'gf-admin-passcode'

function loadStoredPasscode(): string {
  try {
    return sessionStorage.getItem(PASSCODE_KEY) ?? ''
  } catch {
    return ''
  }
}

export default function AdminPage() {
  const [passcode, setPasscode] = useState(loadStoredPasscode)
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault()
    if (!passcode.trim() || authBusy) return
    setAuthBusy(true)
    setAuthError(null)
    const { error } = await supabase.rpc('admin_verify', { p_passcode: passcode.trim() })
    setAuthBusy(false)
    if (error) {
      const msg = error.message
      setAuthError(
        msg.includes('ADMIN_LOCKED')
          ? 'Too many attempts — locked for 15 minutes.'
          : msg.includes('ADMIN_NOT_CONFIGURED')
            ? 'Admin is not configured yet (no passcode seeded).'
            : 'Incorrect passcode.'
      )
      return
    }
    try {
      sessionStorage.setItem(PASSCODE_KEY, passcode.trim())
    } catch { /* private mode */ }
    setAuthed(true)
  }

  useEffect(() => {
    // Auto-login once on mount when a stored passcode exists.
    if (passcode && !authed) handleLogin()
  }, [])

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <p className="text-center text-xs uppercase tracking-widest2 text-clay">Admin</p>
          <h1 className="mt-3 text-center font-serif text-3xl text-ink">Guest Manager</h1>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Admin passcode"
            autoFocus
            className="mt-8 w-full min-h-11 border border-ink/20 bg-transparent px-4 py-3 text-ink outline-none focus:border-ink/50"
          />
          {authError && (
            <p role="alert" className="mt-2 text-xs text-rose-300">
              {authError}
            </p>
          )}
          <button
            type="submit"
            disabled={authBusy || !passcode.trim()}
            className="mt-6 min-h-11 w-full border border-ink bg-ink px-8 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {authBusy ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    )
  }

  return <AdminDashboard passcode={passcode} onSignOut={() => {
    try { sessionStorage.removeItem(PASSCODE_KEY) } catch { /* ignore */ }
    setPasscode('')
    setAuthed(false)
  }} />
}

function AdminDashboard({ passcode, onSignOut }: { passcode: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>('guests')
  const [slug, setSlug] = useState('sample-wedding')

  return (
    <div className="min-h-screen bg-paper px-4 pb-24 pt-6 sm:px-8">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest2 text-clay">Admin</p>
          <h1 className="font-serif text-2xl text-ink">Wedding Manager</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-widest2 text-clay" htmlFor="admin-slug">
            Invitation
          </label>
          <input
            id="admin-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.trim())}
            className="min-h-9 w-44 border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink outline-none focus:border-ink/50"
          />
          <button
            type="button"
            onClick={onSignOut}
            className="min-h-9 border border-ink/20 px-4 py-2 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="mx-auto mt-6 flex max-w-5xl gap-2 overflow-x-auto border-b border-line/70">
        {(['guests', 'details', 'sections', 'pages', 'detail-items', 'venue-items', 'faq', 'gallery', 'events', 'registry'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-xs uppercase tracking-widest2 transition-colors sm:px-4 ${
              tab === t ? 'border-clay text-ink' : 'border-transparent text-clay hover:text-ink'
            }`}
          >
            {t === 'guests' ? 'Guest list' : t === 'events' ? 'Events' : t === 'registry' ? 'Registry' : t === 'pages' ? 'Pages' : t === 'detail-items' ? 'Detail Items' : t === 'venue-items' ? 'Venue Items' : t === 'faq' ? 'FAQ' : t}
          </button>
        ))}
      </nav>

      <main className="mx-auto mt-8 max-w-5xl">
        {tab === 'guests' && <GuestsTab passcode={passcode} slug={slug} />}
        {tab === 'details' && <DetailsTab passcode={passcode} slug={slug} />}
        {tab === 'sections' && <SectionsTab passcode={passcode} slug={slug} />}
        {tab === 'pages' && <PagesTab passcode={passcode} slug={slug} />}
        {tab === 'detail-items' && <PageItemsTab passcode={passcode} slug={slug} pageType="details" title="Detail Items" description="Custom items for the Details page (e.g. Smoking: No smoking, Drinking: No drinking)." />}
        {tab === 'venue-items' && <PageItemsTab passcode={passcode} slug={slug} pageType="venue" title="Venue Items" description="Custom items for the Venue page (e.g. Parking, Dress code, Accommodation)." />}
        {tab === 'faq' && <FaqTab passcode={passcode} slug={slug} />}
        {tab === 'gallery' && <GalleryTab passcode={passcode} slug={slug} />}
        {tab === 'events' && <EventsTab passcode={passcode} slug={slug} />}
        {tab === 'registry' && <RegistryTab passcode={passcode} slug={slug} />}
      </main>
    </div>
  )
}

/* ---------------------------------- guests --------------------------------- */

function GuestsTab({ passcode, slug }: { passcode: string; slug: string }) {
  const [rows, setRows] = useState<AdminRsvpRow[] | null>(null)
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    const [listRes, sumRes] = await Promise.all([
      supabase.rpc('admin_list_rsvps', { p_passcode: passcode, p_slug: slug }),
      supabase.rpc('admin_summary', { p_passcode: passcode, p_slug: slug })
    ])
    if (listRes.error) {
      setError(listRes.error.message.includes('ADMIN_BAD_PASSCODE') ? 'Session expired — sign in again.' : listRes.error.message)
      setRows(null)
      return
    }
    setRows((listRes.data ?? []) as AdminRsvpRow[])
    if (!sumRes.error) setSummary(sumRes.data as AdminSummary)
  }, [passcode, slug])

  useEffect(() => {
    reload()
  }, [reload])

  async function removeRow(id: string) {
    if (!confirm('Delete this RSVP? This cannot be undone.')) return
    setBusyId(id)
    await supabase.rpc('admin_delete_rsvp', { p_passcode: passcode, p_rsvp_id: id })
    setBusyId(null)
    reload()
  }

  function exportCsv() {
    if (!rows) return
    const header = ['Name', 'Phone', 'Status', 'Guests', 'Coming From', 'Message', 'Submitted']
    const lines = rows.map((r) =>
      [r.full_name, r.phone ?? '', r.attendance_status, r.guest_count ?? '', r.coming_from ?? '', r.message ?? '', r.submitted_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rsvps-${slug}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) return <p role="alert" className="text-sm text-rose-300">{error}</p>
  if (!rows) return <p className="text-sm text-ink/60">Loading guest list…</p>

  return (
    <div>
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Attending (parties)" value={summary.attending_parties} />
          <Stat label="Declined" value={summary.declined_parties} />
          <Stat label="Total guests" value={summary.total_guests} />
          <Stat label="RSVP status" value={summary.rsvp_enabled ? 'Open' : 'Closed'} />
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="min-h-10 border border-ink/20 px-5 py-2 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink/60">
          No RSVPs yet. Guests' responses will appear here as they come in.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-line/70">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line/70 text-xs uppercase tracking-widest2 text-clay">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Guests</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3" aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line/40 last:border-0">
                  <td className="px-4 py-3 text-ink">{r.full_name}</td>
                  <td className="px-4 py-3 text-ink/80">{r.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={r.attendance_status === 'attending' ? 'text-emerald-300' : 'text-rose-300'}>
                      {r.attendance_status === 'attending' ? 'Coming' : 'Not coming'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/80">{r.guest_count ?? '—'}</td>
                  <td className="px-4 py-3 text-ink/80">{r.coming_from ?? '—'}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-ink/70" title={r.message ?? ''}>
                    {r.message ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {new Date(r.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      disabled={busyId === r.id}
                      className="text-xs uppercase tracking-widest2 text-rose-300 hover:text-rose-200 disabled:opacity-40"
                    >
                      {busyId === r.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-line/70 bg-paperDeep/50 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest2 text-clay">{label}</p>
      <p className="mt-1 font-serif text-2xl text-ink">{value}</p>
    </div>
  )
}

/* --------------------------------- details --------------------------------- */

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'date' | 'time' | 'datetime-local' | 'number' | 'checkbox' | 'textarea'
  hint?: string
}

const EDITABLE_FIELDS: FieldDef[] = [
  { key: 'bride_name', label: 'Bride name', type: 'text' },
  { key: 'groom_name', label: 'Groom name', type: 'text' },
  { key: 'invitation_title', label: 'Invitation title', type: 'text', hint: 'Line above the names, e.g. “Together with our families”' },
  { key: 'invitation_message', label: 'Couple message', type: 'textarea' },
  { key: 'tagline', label: 'Tagline', type: 'textarea', hint: 'Shown below the hero, e.g. “We are getting married and would love for you to join us…”' },
  { key: 'wedding_date', label: 'Wedding date', type: 'date' },
  { key: 'wedding_time', label: 'Wedding time', type: 'time', hint: 'Leave blank if the time is not decided yet' },
  { key: 'timezone', label: 'Timezone', type: 'text', hint: 'IANA name, e.g. Asia/Karachi' },
  { key: 'venue_name', label: 'Venue name', type: 'text' },
  { key: 'venue_address', label: 'Venue address', type: 'text' },
  { key: 'map_url', label: 'Map link', type: 'text' },
  { key: 'contact_name', label: 'Contact name', type: 'text' },
  { key: 'contact_phone', label: 'Contact phone', type: 'text' },
  { key: 'max_guests_per_rsvp', label: 'Max guests per RSVP', type: 'number' },
  { key: 'rsvp_deadline', label: 'RSVP deadline', type: 'datetime-local', hint: 'Blank = no deadline' },
  { key: 'rsvp_enabled', label: 'RSVP open', type: 'checkbox' },
  { key: 'is_published', label: 'Published (visible to guests)', type: 'checkbox' }
]

function DetailsTab({ passcode, slug }: { passcode: string; slug: string }) {
  const [inv, setInv] = useState<Invitation | null>(null)
  const [draft, setDraft] = useState<Record<string, string | boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    setError(null)
    const { data, error: e } = await supabase
      .from('invitations')
      .select('*')
      .eq('slug', slug)
      .maybeSingle<Invitation>()
    if (e) {
      setError(e.message)
      return
    }
    if (!data) {
      setError(`No invitation with slug "${slug}".`)
      return
    }
    setInv(data)
    const d: Record<string, string | boolean> = {}
    for (const f of EDITABLE_FIELDS) {
      const v = (data as unknown as Record<string, unknown>)[f.key]
      if (f.type === 'checkbox') d[f.key] = Boolean(v)
      else if (f.type === 'datetime-local') d[f.key] = v ? String(v).slice(0, 16) : ''
      else if (f.type === 'time') d[f.key] = v ? String(v).slice(0, 5) : ''
      else d[f.key] = v === null || v === undefined ? '' : String(v)
    }
    setDraft(d)
  }, [slug])

  useEffect(() => {
    reload()
  }, [reload])

  async function save() {
    setBusy(true)
    setError(null)
    setStatus(null)
    const updates: Record<string, unknown> = {}
    for (const f of EDITABLE_FIELDS) {
      const current = (inv as unknown as Record<string, unknown>)[f.key]
      const next = draft[f.key]
      if (f.type === 'checkbox') {
        if (Boolean(current) !== Boolean(next)) updates[f.key] = Boolean(next)
      } else {
        const str = String(next ?? '').trim()
        const cur = current === null || current === undefined ? '' : String(current)
        const normalized =
          f.type === 'datetime-local' ? (str ? new Date(str).toISOString() : '') :
          f.type === 'time' ? (str ? str + ':00' : '') : str
        if (normalized !== cur) updates[f.key] = str === '' ? null : normalized
      }
    }
    if (Object.keys(updates).length === 0) {
      setStatus('No changes.')
      setBusy(false)
      return
    }
    const { error: e } = await supabase.rpc('admin_update_invitation', {
      p_passcode: passcode,
      p_slug: slug,
      p_updates: updates
    })
    setBusy(false)
    if (e) {
      setError(e.message.includes('FIELD_NOT_ALLOWED') ? 'A field was rejected by the server.' : e.message)
      return
    }
    setStatus('Saved.')
    reload()
  }

  if (error && !inv) return <p role="alert" className="text-sm text-rose-300">{error}</p>
  if (!inv) return <p className="text-sm text-ink/60">Loading…</p>

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {EDITABLE_FIELDS.map((f) => (
        <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
          {f.type === 'checkbox' ? (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 border border-ink/20 px-4">
              <input
                type="checkbox"
                checked={Boolean(draft[f.key])}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.checked }))}
                className="h-4 w-4 accent-[#c9a877]"
              />
              <span className="text-xs uppercase tracking-widest2 text-clay">{f.label}</span>
            </label>
          ) : (
            <>
              <label htmlFor={`f-${f.key}`} className="mb-2 block text-xs uppercase tracking-widest2 text-clay">
                {f.label}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  id={`f-${f.key}`}
                  rows={3}
                  value={String(draft[f.key] ?? '')}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className={inputCls()}
                />
              ) : (
                <input
                  id={`f-${f.key}`}
                  type={f.type}
                  value={String(draft[f.key] ?? '')}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className={inputCls()}
                />
              )}
            </>
          )}
          {f.hint && <p className="mt-1 text-[11px] text-ink/50">{f.hint}</p>}
        </div>
      ))}

      <div className="sm:col-span-2">
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        {status && <p className="text-sm text-emerald-300">{status}</p>}
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="mt-2 min-h-11 border border-ink bg-ink px-8 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

/* --------------------------------- sections -------------------------------- */

function SectionsTab({ passcode, slug }: { passcode: string; slug: string }) {
  // Render ALL known section keys — not just rows that exist in the DB.
  // Missing rows default to enabled (matching isSectionEnabled semantics).
  const ALL_SECTION_KEYS: SectionKey[] = [
    'hero', 'couple', 'message', 'countdown', 'details',
    'venue', 'gallery', 'itinerary', 'rsvp', 'registry', 'contact', 'footer'
  ]
  const [rows, setRows] = useState<{ section_key: SectionKey; is_enabled: boolean }[] | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const inv = await supabase.from('invitations').select('id').eq('slug', slug).maybeSingle()
    if (!inv.data) return
    const { data } = await supabase
      .from('invitation_sections')
      .select('section_key, is_enabled')
      .eq('invitation_id', (inv.data as { id: string }).id)
    const dbRows = (data ?? []) as { section_key: SectionKey; is_enabled: boolean }[]
    // Merge: start with all known keys defaulting to enabled, override with DB values
    const merged: { section_key: SectionKey; is_enabled: boolean }[] = ALL_SECTION_KEYS.map(key => {
      const dbRow = dbRows.find(r => r.section_key === key)
      return { section_key: key, is_enabled: dbRow ? dbRow.is_enabled : true }
    })
    setRows(merged)
  }, [slug])

  useEffect(() => {
    reload()
  }, [reload])

  async function toggle(sectionKey: SectionKey, enabled: boolean) {
    setStatus(null)
    const { error } = await supabase.rpc('admin_update_section', {
      p_passcode: passcode,
      p_slug: slug,
      p_section_key: sectionKey,
      p_is_enabled: enabled
    })
    if (error) {
      setStatus(error.message)
      return
    }
    setStatus(`${SECTION_LABELS[sectionKey]} ${enabled ? 'enabled' : 'disabled'}.`)
    reload()
  }

  if (!rows) return <p className="text-sm text-ink/60">Loading…</p>

  return (
    <div>
      <p className="text-sm text-ink/60">Show or hide each section of the invitation page.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <label key={r.section_key} className="flex min-h-12 cursor-pointer items-center justify-between gap-3 border border-ink/20 px-4">
            <span className="text-sm text-ink">{SECTION_LABELS[r.section_key] ?? r.section_key}</span>
            <input
              type="checkbox"
              checked={r.is_enabled}
              onChange={(e) => toggle(r.section_key, e.target.checked)}
              className="h-4 w-4 accent-[#c9a877]"
            />
          </label>
        ))}
      </div>
      {status && <p className="mt-4 text-sm text-emerald-300">{status}</p>}
    </div>
  )
}

/* ---------------------------------- gallery -------------------------------- */

function GalleryTab({ passcode, slug }: { passcode: string; slug: string }) {
  const [items, setItems] = useState<{ id: string; image_url: string | null; alt_text: string | null; content_type: string | null; sort_order: number }[] | null>(null)
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Web-displayable images + videos. HEIC/HEIF are deliberately rejected —
  // they don't render reliably across all guest browsers.
  const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/bmp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime'
  ])
  const MAX_BYTES = 50 * 1024 * 1024 // 50 MB (matches the storage bucket limit)

  const reload = useCallback(async () => {
    const inv = await supabase.from('invitations').select('id').eq('slug', slug).maybeSingle()
    if (!inv.data) return
    const { data } = await supabase
      .from('gallery_items')
      .select('id, image_url, alt_text, content_type, sort_order')
      .eq('invitation_id', (inv.data as { id: string }).id)
      .order('sort_order')
    setItems((data ?? []) as { id: string; image_url: string | null; alt_text: string | null; content_type: string | null; sort_order: number }[])
  }, [slug])

  useEffect(() => {
    reload()
  }, [reload])

  async function add() {
    if (!url.trim()) return
    setBusy(true)
    setStatus(null)
    const { error } = await supabase.rpc('admin_add_gallery_item', {
      p_passcode: passcode,
      p_slug: slug,
      p_image_url: url.trim(),
      p_alt_text: alt.trim() || null
    })
    setBusy(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setUrl('')
    setAlt('')
    setStatus('Photo added.')
    reload()
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return
    setUploading(true)
    setStatus(null)
    let added = 0
    for (const file of list) {
      const msg = validateFile(file)
      if (msg) {
        setStatus(`${file.name}: ${msg}`)
        setUploading(false)
        return
      }
      // 1. Ask the Edge Function for a signed upload URL (validates the
      //    admin passcode server-side — no public storage write access).
      const { data: signData, error: signErr } = await supabase.functions.invoke(
        'upload-gallery-photo',
        { body: { passcode, slug, filename: file.name, contentType: file.type, size: file.size } }
      )
      if (signErr || !signData) {
        setStatus(`${file.name}: ${signErr?.message || 'could not authorize upload'}`)
        setUploading(false)
        return
      }
      // 2. Upload the file directly to Supabase Storage via the signed URL.
      const { error: upErr } = await supabase.storage
        .from('gallery')
        .uploadToSignedUrl(signData.path, signData.token, file, { contentType: file.type })
      if (upErr) {
        setStatus(`${file.name}: upload failed — ${upErr.message}`)
        setUploading(false)
        return
      }
      // 3. Record the gallery item (passcode-gated RPC).
      const { error: rpcErr } = await supabase.rpc('admin_add_uploaded_gallery_item', {
        p_passcode: passcode,
        p_slug: slug,
        p_storage_path: signData.path,
        p_image_url: signData.publicUrl,
        p_alt_text: file.name.replace(/\.[^.]+$/, ''),
        p_content_type: signData.contentType,
        p_sort_order: 0
      })
      if (rpcErr) {
        setStatus(`${file.name}: ${rpcErr.message}`)
        setUploading(false)
        return
      }
      added++
    }
    setUploading(false)
    setStatus(added > 0 ? `Uploaded ${added} item${added > 1 ? 's' : ''}.` : null)
    reload()
  }

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.has(file.type)) {
      return 'unsupported type — use JPG, PNG, WebP, GIF, BMP, SVG, MP4, WebM or MOV (HEIC not supported).'
    }
    if (file.size > MAX_BYTES) {
      return `file is too large — max 50 MB (this one is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`
    }
    return null
  }

  async function remove(id: string) {
    if (!confirm('Remove this photo from the gallery?')) return
    await supabase.rpc('admin_delete_gallery_item', { p_passcode: passcode, p_item_id: id })
    reload()
  }

  if (!items) {
    return status
      ? <p role="alert" className="text-sm text-rose-300">{status}</p>
      : <p className="text-sm text-ink/60">Loading…</p>
  }

  return (
    <div>
      {/* Upload from device — opens the photo picker on iPhone/Android, the
          file dialog on Windows. accept without `capture` lets users choose
          between camera and gallery on mobile. */}
      <div className="border border-dashed border-ink/30 bg-paperDeep/30 p-6 text-center">
        <p className="text-sm text-ink/70">Upload photos from your device</p>
        <p className="mt-1 text-[11px] text-ink/50">JPG, PNG, WebP, GIF, BMP, SVG, MP4, WebM or MOV — up to 50 MB each.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,video/mp4,video/webm,video/quicktime"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files).catch(() => {})
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-4 min-h-11 border border-ink bg-ink px-8 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Choose photos'}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line/50" />
        <span className="text-xs uppercase tracking-widest2 text-clay">or paste a link</span>
        <div className="h-px flex-1 bg-line/50" />
      </div>

      <p className="mt-4 text-sm text-ink/60">
        Paste a public image URL (e.g. an upload to the Supabase <code>gallery</code> bucket or any photo host).
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/photo.jpg" className={inputCls()} />
        <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Description (optional)" className={inputCls()} />
        <button
          type="button"
          onClick={add}
          disabled={busy || !url.trim()}
          className="min-h-11 border border-ink bg-ink px-6 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Adding…' : 'Add photo'}
        </button>
      </div>
      {status && <p className="mt-3 text-sm text-emerald-300">{status}</p>}

      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="group relative border border-line/70">
              {(it.content_type || '').startsWith('video/') ? (
                <video
                  src={it.image_url ?? ''}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-[3/4] w-full object-cover"
                />
              ) : (
                <img
                  src={it.image_url ?? ''}
                  alt={it.alt_text ?? 'Gallery photo'}
                  className="aspect-[3/4] w-full object-cover"
                  loading="lazy"
                />
              )}
              <button
                type="button"
                onClick={() => remove(it.id)}
                className="absolute right-2 top-2 border border-ink/30 bg-paper/90 px-2 py-1 text-[10px] uppercase tracking-widest2 text-rose-300 opacity-0 transition-opacity group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function inputCls(hasError = false) {
  return `w-full min-h-11 border bg-transparent px-4 py-3 text-sm text-ink outline-none transition-colors ${
    hasError ? 'border-rose-400' : 'border-ink/20 focus:border-ink/50'
  }`
}

/* ---------------------------------- events --------------------------------- */

const EVENT_FIELDS: FieldDef[] = [
  { key: 'title', label: 'Event title', type: 'text', hint: 'e.g. Mehndi, Barat, Walima' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'event_date', label: 'Date', type: 'date', hint: 'Leave blank if TBD' },
  { key: 'event_time', label: 'Time', type: 'time', hint: 'Leave blank if TBD' },
  { key: 'timezone', label: 'Timezone', type: 'text', hint: 'IANA name, e.g. Asia/Karachi' },
  { key: 'venue_name', label: 'Venue name', type: 'text' },
  { key: 'venue_address', label: 'Venue address', type: 'text' },
  { key: 'map_url', label: 'Map link', type: 'text' },
  { key: 'dress_code', label: 'Dress code', type: 'text', hint: 'e.g. Formal, Traditional' },
  { key: 'sort_order', label: 'Sort order', type: 'number', hint: 'Lower appears first' }
]

function EventsTab({ passcode, slug }: { passcode: string; slug: string }) {
  const [events, setEvents] = useState<AdminWeddingEvent[] | null>(null)
  const [editing, setEditing] = useState<AdminWeddingEvent | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_wedding_events', {
      p_passcode: passcode,
      p_slug: slug
    })
    if (error) {
      setStatus(error.message)
      return
    }
    setEvents((data ?? []) as AdminWeddingEvent[])
  }, [passcode, slug])

  useEffect(() => {
    reload()
  }, [reload])

  function startEdit(event: AdminWeddingEvent | null) {
    setEditing(event ?? ({} as AdminWeddingEvent))
    setStatus(null)
    const d: Record<string, string> = {}
    for (const f of EVENT_FIELDS) {
      const v = event ? (event as unknown as Record<string, unknown>)[f.key] : null
      d[f.key] = v === null || v === undefined ? '' : String(v)
    }
    setDraft(d)
  }

  async function save() {
    setBusy(true)
    setStatus(null)
    const payload: Record<string, unknown> = {}
    for (const f of EVENT_FIELDS) {
      const str = String(draft[f.key] ?? '').trim()
      payload[f.key] = str === '' ? null : str
    }
    // Ensure title is present
    if (!payload.title) {
      setStatus('Title is required.')
      setBusy(false)
      return
    }
    const { error } = await supabase.rpc('admin_save_wedding_event', {
      p_passcode: passcode,
      p_slug: slug,
      p_event_id: editing?.id ?? null,
      p_payload: payload
    })
    setBusy(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setEditing(null)
    setStatus(editing ? 'Event updated.' : 'Event added.')
    reload()
  }

  async function remove(id: string) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    await supabase.rpc('admin_delete_wedding_event', { p_passcode: passcode, p_event_id: id })
    reload()
  }

  if (!events) {
    return status
      ? <p role="alert" className="text-sm text-rose-300">{status}</p>
      : <p className="text-sm text-ink/60">Loading…</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">Manage the events shown in the Pakistan itinerary.</p>
        {!editing && (
          <button
            type="button"
            onClick={() => startEdit(null)}
            className="min-h-10 border border-ink bg-ink px-5 py-2 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90"
          >
            Add event
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-6 border border-line/70 bg-paperDeep/30 p-6">
          <h3 className="font-serif text-xl text-ink">{editing?.id ? 'Edit event' : 'New event'}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {EVENT_FIELDS.map((f) => (
              <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`e-${f.key}`} className="mb-2 block text-xs uppercase tracking-widest2 text-clay">
                  {f.label}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={`e-${f.key}`}
                    rows={3}
                    value={String(draft[f.key] ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className={inputCls()}
                  />
                ) : (
                  <input
                    id={`e-${f.key}`}
                    type={f.type}
                    value={String(draft[f.key] ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className={inputCls()}
                  />
                )}
                {f.hint && <p className="mt-1 text-[11px] text-ink/50">{f.hint}</p>}
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="min-h-11 border border-ink bg-ink px-8 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save event'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="min-h-11 border border-ink/20 px-6 py-3 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink/10"
            >
              Cancel
            </button>
          </div>
          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}
        </div>
      )}

      {status && !editing && <p className="mt-4 text-sm text-emerald-300">{status}</p>}

      {events.length > 0 && !editing && (
        <div className="mt-6 space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-4 border border-line/40 px-5 py-4">
              <div>
                <p className="font-serif text-lg text-ink">{event.title}</p>
                {event.event_date && (
                  <p className="mt-1 text-xs text-clay">
                    {event.event_date}{event.event_time ? ` · ${String(event.event_time).slice(0, 5)}` : ''}
                    {event.venue_name ? ` · ${event.venue_name}` : ''}
                  </p>
                )}
                {event.description && (
                  <p className="mt-1 text-xs text-ink/60 line-clamp-2">{event.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(event)}
                  className="text-xs uppercase tracking-widest2 text-clay hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(event.id)}
                  className="text-xs uppercase tracking-widest2 text-rose-300 hover:text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length === 0 && !editing && (
        <p className="mt-8 text-center text-sm text-ink/60">
          No events yet. Add your first event (Mehndi, Barat, Walima, etc.).
        </p>
      )}
    </div>
  )
}

/* --------------------------------- registry -------------------------------- */

const REGISTRY_FIELDS: FieldDef[] = [
  { key: 'title', label: 'Title', type: 'text', hint: 'e.g. Amazon Registry, Honeyfund' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'url', label: 'Link URL', type: 'text' },
  { key: 'button_label', label: 'Button label', type: 'text', hint: 'Defaults to “View registry”' },
  { key: 'image_url', label: 'Image URL', type: 'text', hint: 'Optional preview image' },
  { key: 'sort_order', label: 'Sort order', type: 'number', hint: 'Lower appears first' }
]

function RegistryTab({ passcode, slug }: { passcode: string; slug: string }) {
  const [items, setItems] = useState<AdminRegistryItem[] | null>(null)
  const [editing, setEditing] = useState<AdminRegistryItem | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_registry_items', {
      p_passcode: passcode,
      p_slug: slug
    })
    if (error) {
      setStatus(error.message)
      return
    }
    setItems((data ?? []) as AdminRegistryItem[])
  }, [passcode, slug])

  useEffect(() => {
    reload()
  }, [reload])

  function startEdit(item: AdminRegistryItem | null) {
    setEditing(item ?? ({} as AdminRegistryItem))
    setStatus(null)
    const d: Record<string, string> = {}
    for (const f of REGISTRY_FIELDS) {
      const v = item ? (item as unknown as Record<string, unknown>)[f.key] : null
      d[f.key] = v === null || v === undefined ? '' : String(v)
    }
    setDraft(d)
  }

  async function save() {
    setBusy(true)
    setStatus(null)
    const payload: Record<string, unknown> = {}
    for (const f of REGISTRY_FIELDS) {
      const str = String(draft[f.key] ?? '').trim()
      payload[f.key] = str === '' ? null : str
    }
    if (!payload.title) {
      setStatus('Title is required.')
      setBusy(false)
      return
    }
    if (!payload.url) {
      setStatus('URL is required.')
      setBusy(false)
      return
    }
    const { error } = await supabase.rpc('admin_save_registry_item', {
      p_passcode: passcode,
      p_slug: slug,
      p_item_id: editing?.id ?? null,
      p_payload: payload
    })
    setBusy(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setEditing(null)
    setStatus(editing ? 'Registry item updated.' : 'Registry item added.')
    reload()
  }

  async function remove(id: string) {
    if (!confirm('Delete this registry item? This cannot be undone.')) return
    await supabase.rpc('admin_delete_registry_item', { p_passcode: passcode, p_item_id: id })
    reload()
  }

  if (!items) {
    return status
      ? <p role="alert" className="text-sm text-rose-300">{status}</p>
      : <p className="text-sm text-ink/60">Loading…</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">Manage the wedding registry links shown to guests.</p>
        {!editing && (
          <button
            type="button"
            onClick={() => startEdit(null)}
            className="min-h-10 border border-ink bg-ink px-5 py-2 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90"
          >
            Add registry
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-6 border border-line/70 bg-paperDeep/30 p-6">
          <h3 className="font-serif text-xl text-ink">{editing?.id ? 'Edit registry item' : 'New registry item'}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {REGISTRY_FIELDS.map((f) => (
              <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`r-${f.key}`} className="mb-2 block text-xs uppercase tracking-widest2 text-clay">
                  {f.label}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={`r-${f.key}`}
                    rows={3}
                    value={String(draft[f.key] ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className={inputCls()}
                  />
                ) : (
                  <input
                    id={`r-${f.key}`}
                    type={f.type}
                    value={String(draft[f.key] ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className={inputCls()}
                  />
                )}
                {f.hint && <p className="mt-1 text-[11px] text-ink/50">{f.hint}</p>}
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="min-h-11 border border-ink bg-ink px-8 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save item'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="min-h-11 border border-ink/20 px-6 py-3 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink/10"
            >
              Cancel
            </button>
          </div>
          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}
        </div>
      )}

      {status && !editing && <p className="mt-4 text-sm text-emerald-300">{status}</p>}

      {items.length > 0 && !editing && (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 border border-line/40 px-5 py-4">
              <div className="flex gap-4">
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="h-16 w-16 object-cover" />
                )}
                <div>
                  <p className="font-serif text-lg text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-clay">{item.button_label} · {item.url}</p>
                  {item.description && (
                    <p className="mt-1 text-xs text-ink/60 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-xs uppercase tracking-widest2 text-clay hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-xs uppercase tracking-widest2 text-rose-300 hover:text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !editing && (
        <p className="mt-8 text-center text-sm text-ink/60">
          No registry items yet. Add your first registry link.
        </p>
      )}
    </div>
  )
}

/* --------------------------------- pages ----------------------------------- */

const PAGE_TYPES = ['details', 'venue', 'faq'] as const
const DEFAULT_LABELS: Record<string, string> = {
  details: 'Details',
  venue: 'Venue',
  faq: 'FAQ'
}
const DEFAULT_TITLES: Record<string, string> = {
  details: 'The Details',
  venue: 'Venue',
  faq: 'Frequently Asked Questions'
}

function PagesTab({ passcode, slug }: { passcode: string; slug: string }) {
  const [settings, setSettings] = useState<PageSettings[] | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { button_label: string; page_title: string; page_subtitle: string; is_enabled: boolean; sort_order: string }>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    setStatus(null)
    const { data, error } = await supabase.rpc('admin_list_page_settings', { p_passcode: passcode, p_slug: slug })
    if (error) {
      setStatus(error.message)
      return
    }
    const rows = (data ?? []) as PageSettings[]
    setSettings(rows)
    const d: Record<string, { button_label: string; page_title: string; page_subtitle: string; is_enabled: boolean; sort_order: string }> = {}
    for (const r of rows) {
      d[r.page_type] = {
        button_label: r.button_label ?? '',
        page_title: r.page_title ?? '',
        page_subtitle: r.page_subtitle ?? '',
        is_enabled: r.is_enabled,
        sort_order: String(r.sort_order)
      }
    }
    setDrafts(d)
  }, [passcode, slug])

  useEffect(() => {
    reload()
  }, [reload])

  async function save(pageType: string) {
    const d = drafts[pageType]
    if (!d) return
    setBusy(true)
    setStatus(null)
    const { error } = await supabase.rpc('admin_save_page_settings', {
      p_passcode: passcode,
      p_slug: slug,
      p_page_type: pageType,
      p_button_label: d.button_label.trim() || null,
      p_page_title: d.page_title.trim() || null,
      p_page_subtitle: d.page_subtitle.trim() || null,
      p_is_enabled: d.is_enabled,
      p_sort_order: parseInt(d.sort_order) || 0
    })
    setBusy(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setStatus(`${pageType} settings saved.`)
    reload()
  }

  if (!settings) return <p className="text-sm text-ink/60">Loading…</p>

  const allTypes = PAGE_TYPES.map(pt => ({
    page_type: pt,
    draft: drafts[pt] ?? { button_label: '', page_title: '', page_subtitle: '', is_enabled: true, sort_order: '0' }
  }))

  return (
    <div>
      <p className="text-sm text-ink/60">Customize the nav button labels, page titles, and visibility for each sub-page.</p>
      <div className="mt-6 space-y-8">
        {allTypes.map(({ page_type, draft }) => (
          <div key={page_type} className="border border-line/70 bg-paperDeep/30 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-ink capitalize">{page_type}</h3>
              <label className="flex cursor-pointer items-center gap-2">
                <span className="text-xs uppercase tracking-widest2 text-clay">Enabled</span>
                <input
                  type="checkbox"
                  checked={draft.is_enabled}
                  onChange={(e) => setDrafts((d) => ({ ...d, [page_type]: { ...draft, is_enabled: e.target.checked } }))}
                  className="h-4 w-4 accent-[#c9a877]"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest2 text-clay">Button label</label>
                <input
                  type="text"
                  value={draft.button_label}
                  placeholder={DEFAULT_LABELS[page_type]}
                  onChange={(e) => setDrafts((d) => ({ ...d, [page_type]: { ...draft, button_label: e.target.value } }))}
                  className={inputCls()}
                />
                <p className="mt-1 text-[11px] text-ink/50">Leave blank for default: {DEFAULT_LABELS[page_type]}</p>
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest2 text-clay">Page title</label>
                <input
                  type="text"
                  value={draft.page_title}
                  placeholder={DEFAULT_TITLES[page_type]}
                  onChange={(e) => setDrafts((d) => ({ ...d, [page_type]: { ...draft, page_title: e.target.value } }))}
                  className={inputCls()}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest2 text-clay">Page subtitle</label>
                <textarea
                  rows={2}
                  value={draft.page_subtitle}
                  onChange={(e) => setDrafts((d) => ({ ...d, [page_type]: { ...draft, page_subtitle: e.target.value } }))}
                  className={inputCls()}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest2 text-clay">Sort order</label>
                <input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDrafts((d) => ({ ...d, [page_type]: { ...draft, sort_order: e.target.value } }))}
                  className={inputCls()}
                />
                <p className="mt-1 text-[11px] text-ink/50">Lower appears first in the nav</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => save(page_type)}
              disabled={busy}
              className="mt-4 min-h-11 border border-ink bg-ink px-8 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Saving…' : `Save ${page_type} settings`}
            </button>
          </div>
        ))}
      </div>
      {status && <p className="mt-4 text-sm text-emerald-300">{status}</p>}
    </div>
  )
}

/* ------------------------------ page items --------------------------------- */

const PAGE_ITEM_FIELDS: FieldDef[] = [
  { key: 'label', label: 'Label', type: 'text', hint: 'e.g. Smoking, Drinking, Ceremony' },
  { key: 'value', label: 'Value', type: 'text', hint: 'e.g. No smoking, No drinking, 6:00 PM' },
  { key: 'sort_order', label: 'Sort order', type: 'number', hint: 'Lower appears first' }
]

function PageItemsTab({ passcode, slug, pageType, title, description }: { passcode: string; slug: string; pageType: string; title: string; description: string }) {
  const [items, setItems] = useState<AdminPageItem[] | null>(null)
  const [editing, setEditing] = useState<AdminPageItem | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_page_items', { p_passcode: passcode, p_slug: slug, p_page_type: pageType })
    if (error) {
      setStatus(error.message)
      return
    }
    setItems((data ?? []) as AdminPageItem[])
  }, [passcode, slug, pageType])

  useEffect(() => {
    reload()
  }, [reload])

  function startEdit(item: AdminPageItem | null) {
    setEditing(item ?? ({} as AdminPageItem))
    setStatus(null)
    const d: Record<string, string> = {}
    for (const f of PAGE_ITEM_FIELDS) {
      const v = item ? (item as unknown as Record<string, unknown>)[f.key] : null
      d[f.key] = v === null || v === undefined ? '' : String(v)
    }
    setDraft(d)
  }

  async function save() {
    setBusy(true)
    setStatus(null)
    const payload: Record<string, unknown> = {}
    for (const f of PAGE_ITEM_FIELDS) {
      const str = String(draft[f.key] ?? '').trim()
      payload[f.key] = str === '' ? null : str
    }
    if (!payload.label) {
      setStatus('Label is required.')
      setBusy(false)
      return
    }
    const { error } = await supabase.rpc('admin_save_page_item', {
      p_passcode: passcode,
      p_slug: slug,
      p_item_id: editing?.id ?? null,
      p_page_type: pageType,
      p_label: payload.label as string,
      p_value: payload.value as string,
      p_sort_order: parseInt(String(payload.sort_order)) || 0
    })
    setBusy(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setEditing(null)
    setStatus(editing ? 'Item updated.' : 'Item added.')
    reload()
  }

  async function remove(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    await supabase.rpc('admin_delete_page_item', { p_passcode: passcode, p_item_id: id })
    reload()
  }

  if (!items) {
    return status
      ? <p role="alert" className="text-sm text-rose-300">{status}</p>
      : <p className="text-sm text-ink/60">Loading…</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">{description}</p>
        {!editing && (
          <button
            type="button"
            onClick={() => startEdit(null)}
            className="min-h-10 border border-ink bg-ink px-5 py-2 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90"
          >
            Add item
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-6 border border-line/70 bg-paperDeep/30 p-6">
          <h3 className="font-serif text-xl text-ink">{editing?.id ? 'Edit item' : 'New item'}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {PAGE_ITEM_FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={`pi-${f.key}`} className="mb-2 block text-xs uppercase tracking-widest2 text-clay">
                  {f.label}
                </label>
                <input
                  id={`pi-${f.key}`}
                  type={f.type}
                  value={String(draft[f.key] ?? '')}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className={inputCls()}
                />
                {f.hint && <p className="mt-1 text-[11px] text-ink/50">{f.hint}</p>}
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="min-h-11 border border-ink bg-ink px-8 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save item'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="min-h-11 border border-ink/20 px-6 py-3 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink/10"
            >
              Cancel
            </button>
          </div>
          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}
        </div>
      )}

      {status && !editing && <p className="mt-4 text-sm text-emerald-300">{status}</p>}

      {items.length > 0 && !editing && (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 border border-line/40 px-5 py-4">
              <div>
                <p className="font-serif text-lg text-ink">{item.label}</p>
                <p className="mt-1 text-sm text-clay">{item.value}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-xs uppercase tracking-widest2 text-clay hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-xs uppercase tracking-widest2 text-rose-300 hover:text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !editing && (
        <p className="mt-8 text-center text-sm text-ink/60">
          No items yet. Add your first one.
        </p>
      )}
    </div>
  )
}

/* ---------------------------------- faq ------------------------------------ */

const FAQ_FIELDS: FieldDef[] = [
  { key: 'question', label: 'Question', type: 'text' },
  { key: 'answer', label: 'Answer', type: 'textarea' },
  { key: 'sort_order', label: 'Sort order', type: 'number', hint: 'Lower appears first' }
]

function FaqTab({ passcode, slug }: { passcode: string; slug: string }) {
  const [items, setItems] = useState<AdminFaqItem[] | null>(null)
  const [editing, setEditing] = useState<AdminFaqItem | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_faq_items', { p_passcode: passcode, p_slug: slug })
    if (error) {
      setStatus(error.message)
      return
    }
    setItems((data ?? []) as AdminFaqItem[])
  }, [passcode, slug])

  useEffect(() => {
    reload()
  }, [reload])

  function startEdit(item: AdminFaqItem | null) {
    setEditing(item ?? ({} as AdminFaqItem))
    setStatus(null)
    const d: Record<string, string> = {}
    for (const f of FAQ_FIELDS) {
      const v = item ? (item as unknown as Record<string, unknown>)[f.key] : null
      d[f.key] = v === null || v === undefined ? '' : String(v)
    }
    setDraft(d)
  }

  async function save() {
    setBusy(true)
    setStatus(null)
    const payload: Record<string, unknown> = {}
    for (const f of FAQ_FIELDS) {
      const str = String(draft[f.key] ?? '').trim()
      payload[f.key] = str === '' ? null : str
    }
    if (!payload.question) {
      setStatus('Question is required.')
      setBusy(false)
      return
    }
    const { error } = await supabase.rpc('admin_save_faq_item', {
      p_passcode: passcode,
      p_slug: slug,
      p_item_id: editing?.id ?? null,
      p_question: payload.question as string,
      p_answer: payload.answer as string,
      p_sort_order: parseInt(String(payload.sort_order)) || 0
    })
    setBusy(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setEditing(null)
    setStatus(editing ? 'FAQ item updated.' : 'FAQ item added.')
    reload()
  }

  async function remove(id: string) {
    if (!confirm('Delete this FAQ item? This cannot be undone.')) return
    await supabase.rpc('admin_delete_faq_item', { p_passcode: passcode, p_item_id: id })
    reload()
  }

  if (!items) {
    return status
      ? <p role="alert" className="text-sm text-rose-300">{status}</p>
      : <p className="text-sm text-ink/60">Loading…</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">Manage the FAQ items shown on the FAQ page.</p>
        {!editing && (
          <button
            type="button"
            onClick={() => startEdit(null)}
            className="min-h-10 border border-ink bg-ink px-5 py-2 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90"
          >
            Add FAQ
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-6 border border-line/70 bg-paperDeep/30 p-6">
          <h3 className="font-serif text-xl text-ink">{editing?.id ? 'Edit FAQ item' : 'New FAQ item'}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FAQ_FIELDS.map((f) => (
              <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`faq-${f.key}`} className="mb-2 block text-xs uppercase tracking-widest2 text-clay">
                  {f.label}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={`faq-${f.key}`}
                    rows={3}
                    value={String(draft[f.key] ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className={inputCls()}
                  />
                ) : (
                  <input
                    id={`faq-${f.key}`}
                    type={f.type}
                    value={String(draft[f.key] ?? '')}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className={inputCls()}
                  />
                )}
                {f.hint && <p className="mt-1 text-[11px] text-ink/50">{f.hint}</p>}
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="min-h-11 border border-ink bg-ink px-8 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save FAQ'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="min-h-11 border border-ink/20 px-6 py-3 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink/10"
            >
              Cancel
            </button>
          </div>
          {status && <p className="mt-3 text-sm text-rose-300">{status}</p>}
        </div>
      )}

      {status && !editing && <p className="mt-4 text-sm text-emerald-300">{status}</p>}

      {items.length > 0 && !editing && (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 border border-line/40 px-5 py-4">
              <div>
                <p className="font-serif text-lg text-ink">{item.question}</p>
                <p className="mt-1 text-xs text-ink/60 line-clamp-2">{item.answer}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-xs uppercase tracking-widest2 text-clay hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-xs uppercase tracking-widest2 text-rose-300 hover:text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !editing && (
        <p className="mt-8 text-center text-sm text-ink/60">
          No FAQ items yet. Add your first question.
        </p>
      )}
    </div>
  )
}
