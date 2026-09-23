/**
 * Runtime API tests against the live Supabase project.
 * Reads VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY from .env (never
 * prints them) and exercises the same endpoints the frontend uses:
 *
 *  1. Invitation load (published)   — PostgREST select used by useInvitation
 *  2. Section + gallery reads       — RLS-gated public reads
 *  3. RSVP submit (no phone)        — submit_rsvp RPC happy path
 *  4. RSVP resubmit (same phone)    — upsert dedup (same row id returned)
 *  5. RSVP invalid status           — server rejects with INVALID_STATUS
 *  6. Unauthenticated rsvps SELECT  — empty result (guest privacy holds)
 *  7. submit_rsvp on unknown slug   — INVITATION_NOT_FOUND
 *  8. admin RPC passcode gate       — wrong passcode rejected, right one ok
 *  9. admin guest list + summary    — shape of the admin dashboard data
 *
 * Cleanup: deletes rows it created via the service-role key read from
 * SUPABASE_SERVICE_ROLE_KEY in .env.local (gitignored) when present.
 * Run: npm test
 */
import fs from 'node:fs'

const env = {}
for (const f of ['.env', '.env.local']) {
  if (!fs.existsSync(f)) continue
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const URL_ = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_ || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in .env')
  process.exit(1)
}

const SLUG = env.TEST_INVITE_SLUG || 'sample-wedding'
const TEST_PHONE = '+1 555 0199'
const results = []
let createdIds = []

function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function rest(path, { method = 'GET', key = KEY, body } = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : ''
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* non-JSON */ }
  return { status: res.status, json, text }
}

async function rpc(fn, body) {
  const res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* non-JSON */ }
  return { status: res.status, json, text }
}

// 1. Invitation load (same query shape as useInvitation)
{
  const { status, json } = await rest(
    `invitations?select=id,slug,bride_name,groom_name,wedding_date,wedding_time,timezone,rsvp_enabled,rsvp_deadline,max_guests_per_rsvp&slug=eq.${encodeURIComponent(SLUG)}&is_published=eq.true`
  )
  const row = Array.isArray(json) ? json[0] : null
  check('invitation loads by slug (published)', status === 200 && Boolean(row), row ? row.slug : `status ${status}`)
  if (!row) { summarize(); process.exit(1) }
  globalThis.__invitation = row
}

// 2. Section + gallery reads (RLS-gated public reads)
{
  const invId = globalThis.__invitation.id
  const sec = await rest(`invitation_sections?select=section_key,is_enabled,sort_order&invitation_id=eq.${invId}&order=sort_order.asc`)
  const gal = await rest(`gallery_items?select=id,storage_path,alt_text,sort_order&invitation_id=eq.${invId}&order=sort_order.asc`)
  check('sections readable (RLS)', sec.status === 200 && Array.isArray(sec.json), `${sec.json?.length ?? 0} rows`)
  check('gallery readable (RLS)', gal.status === 200 && Array.isArray(gal.json), `${gal.json?.length ?? 0} rows`)
}

// 3. RSVP happy path (no phone). Note: the RPC returns a JSON array of
// { id, submitted_at } because it is RETURNS TABLE.
{
  const { status, json } = await rpc('submit_rsvp', {
    p_invitation_slug: SLUG,
    p_full_name: 'Test Guest A',
    p_phone: null,
    p_attendance_status: 'attending',
    p_guest_count: 2,
    p_message: 'api-test run'
  })
  const row = Array.isArray(json) ? json[0] : null
  check('submit_rsvp happy path', status === 200 && Boolean(row?.id), status === 200 ? 'created' : (json?.message || `status ${status}`))
  if (row?.id) createdIds.push(row.id)
}

// 4. Upsert dedup: resubmitting with the same phone must UPDATE the same row
// (same id, same original submitted_at) rather than insert a duplicate.
// RLS hides rsvps from anon clients by design, so verification uses the RPC's
// own return values instead of a SELECT.
{
  const args = {
    p_invitation_slug: SLUG,
    p_full_name: 'Test Guest B',
    p_phone: TEST_PHONE,
    p_attendance_status: 'attending',
    p_guest_count: 1,
    p_message: null
  }
  const first = await rpc('submit_rsvp', args)
  const second = await rpc('submit_rsvp', { ...args, p_guest_count: 3, p_message: 'updated by test' })
  const firstRow = Array.isArray(first.json) ? first.json[0] : null
  const secondRow = Array.isArray(second.json) ? second.json[0] : null
  const sameRow =
    first.status === 200 && second.status === 200 &&
    firstRow?.id && secondRow?.id === firstRow?.id &&
    secondRow?.submitted_at === firstRow?.submitted_at
  check('resubmission upserts (same row, not duplicate)', sameRow,
    sameRow ? 'id + submitted_at unchanged' : `first=${first.status}, second=${second.status}`)
  if (firstRow?.id) createdIds.push(firstRow.id)
  if (secondRow?.id && secondRow.id !== firstRow?.id) createdIds.push(secondRow.id)
}

// 5. Invalid attendance status rejected
{
  const { status, text } = await rpc('submit_rsvp', {
    p_invitation_slug: SLUG,
    p_full_name: 'Test Guest C',
    p_phone: null,
    p_attendance_status: 'maybe',
    p_guest_count: 1,
    p_message: null
  })
  check('invalid attendance_status rejected', status === 400 && text.includes('INVALID_STATUS'), text.slice(0, 80))
}

// 6. Guest privacy: unauthenticated SELECT on rsvps must return empty
{
  const { status, json } = await rest('rsvps?select=*')
  check('rsvps not publicly readable (RLS)', status === 200 && Array.isArray(json) && json.length === 0,
    `rows visible: ${json?.length ?? 'n/a'}`)
}

// 7. Unknown slug → INVITATION_NOT_FOUND
{
  const { status, text } = await rpc('submit_rsvp', {
    p_invitation_slug: 'definitely-not-a-real-slug',
    p_full_name: 'Ghost',
    p_phone: null,
    p_attendance_status: 'attending',
    p_guest_count: 1,
    p_message: null
  })
  check('unknown slug rejected', status === 400 && text.includes('INVITATION_NOT_FOUND'), text.slice(0, 80))
}

// 8/9. Admin RPCs: passcode gate + guest list/summary shape
{
  const adminPass = env.ADMIN_PASSCODE
  if (adminPass) {
    const bad = await rpc('admin_verify', { p_passcode: 'definitely-wrong' })
    check('admin rejects wrong passcode', bad.status === 400 && bad.text.includes('ADMIN_BAD_PASSCODE'), bad.text.slice(0, 60))

    const good = await rpc('admin_verify', { p_passcode: adminPass })
    check('admin accepts correct passcode', good.status === 200 && good.json?.ok === true, `status ${good.status}`)

    const list = await rpc('admin_list_rsvps', { p_passcode: adminPass, p_slug: SLUG })
    check('admin guest list returns array', list.status === 200 && Array.isArray(list.json), `status ${list.status}`)

    const sum = await rpc('admin_summary', { p_passcode: adminPass, p_slug: SLUG })
    check('admin summary has counts', sum.status === 200 && typeof sum.json?.total_guests === 'number', `total_guests=${sum.json?.total_guests}`)
  } else {
    console.log('SKIP admin tests — ADMIN_PASSCODE not set in .env.local')
  }
}

// Cleanup (best-effort): delete rows created by this run.
if (SERVICE_KEY && createdIds.length > 0) {
  for (const id of createdIds) {
    await fetch(`${URL_}/rest/v1/rsvps?id=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    })
  }
  console.log(`cleanup: deleted ${createdIds.length} test rsvp row(s)`)
} else if (createdIds.length > 0) {
  console.log(`cleanup skipped: add SUPABASE_SERVICE_ROLE_KEY to .env.local (gitignored) to auto-delete ${createdIds.length} test row(s)`)
}

function summarize() {
  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length > 0) process.exit(1)
}

summarize()
