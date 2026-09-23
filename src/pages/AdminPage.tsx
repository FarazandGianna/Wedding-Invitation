import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type {
  AdminRsvpRow,
  AdminSummary,
  Invitation,
  SectionKey
} from '../types/invitation'

type Tab = 'guests' | 'details' | 'sections' | 'gallery'

const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero (names + date)',
  couple: 'Couple intro',
  message: 'Couple message',
  countdown: 'Countdown',
  details: 'Details (when/contact)',
  venue: 'Venue (where/map)',
  gallery: 'Gallery',
  rsvp: 'RSVP form',
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

      <nav className="mx-auto mt-6 flex max-w-5xl gap-2 border-b border-line/70">
        {(['guests', 'details', 'sections', 'gallery'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-xs uppercase tracking-widest2 transition-colors ${
              tab === t ? 'border-clay text-ink' : 'border-transparent text-clay hover:text-ink'
            }`}
          >
            {t === 'guests' ? 'Guest list' : t}
          </button>
        ))}
      </nav>

      <main className="mx-auto mt-8 max-w-5xl">
        {tab === 'guests' && <GuestsTab passcode={passcode} slug={slug} />}
        {tab === 'details' && <DetailsTab passcode={passcode} slug={slug} />}
        {tab === 'sections' && <SectionsTab passcode={passcode} slug={slug} />}
        {tab === 'gallery' && <GalleryTab passcode={passcode} slug={slug} />}
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
    const header = ['Name', 'Phone', 'Status', 'Guests', 'Message', 'Submitted']
    const lines = rows.map((r) =>
      [r.full_name, r.phone ?? '', r.attendance_status, r.guest_count ?? '', r.message ?? '', r.submitted_at]
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
  const [rows, setRows] = useState<{ section_key: SectionKey; is_enabled: boolean }[] | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const inv = await supabase.from('invitations').select('id').eq('slug', slug).maybeSingle()
    if (!inv.data) return
    const { data } = await supabase
      .from('invitation_sections')
      .select('section_key, is_enabled')
      .eq('invitation_id', (inv.data as { id: string }).id)
    setRows((data ?? []) as { section_key: SectionKey; is_enabled: boolean }[])
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
  const [items, setItems] = useState<{ id: string; image_url: string | null; alt_text: string | null; sort_order: number }[] | null>(null)
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const inv = await supabase.from('invitations').select('id').eq('slug', slug).maybeSingle()
    if (!inv.data) return
    const { data } = await supabase
      .from('gallery_items')
      .select('id, image_url, alt_text, sort_order')
      .eq('invitation_id', (inv.data as { id: string }).id)
      .order('sort_order')
    setItems((data ?? []) as { id: string; image_url: string | null; alt_text: string | null; sort_order: number }[])
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

  async function remove(id: string) {
    if (!confirm('Remove this photo from the gallery?')) return
    await supabase.rpc('admin_delete_gallery_item', { p_passcode: passcode, p_item_id: id })
    reload()
  }

  if (!items) return <p className="text-sm text-ink/60">Loading…</p>

  return (
    <div>
      <p className="text-sm text-ink/60">
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
              <img
                src={it.image_url ?? ''}
                alt={it.alt_text ?? 'Gallery photo'}
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
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
