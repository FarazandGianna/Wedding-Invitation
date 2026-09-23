// Edge Function: upload-gallery-photo
//
// Mints a signed upload URL for the gallery storage bucket. The browser
// sends the admin passcode + file metadata (NOT the file itself); this
// function validates the passcode via admin_verify, then creates a signed
// upload URL using the service role key. The browser uploads the actual
// file directly to Supabase Storage through that signed URL — so:
//   - uploads are admin-only (passcode-gated), and
//   - there is no Edge Function body-size limit, and
//   - NO public INSERT policy is needed on the storage bucket.
//
// Deploy with verify_jwt = false — this function's auth is the passcode.
// Invoke as: POST /functions/v1/upload-gallery-photo  (JSON body)
//
// Uses plain fetch (no external imports) for reliable cold starts.

const ALLOWED = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/bmp', 'bmp'],
  ['image/svg+xml', 'svg'],
  ['video/mp4', 'mp4'],
  ['video/webm', 'webm'],
  ['video/quicktime', 'mov'],
])
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB — matches the storage bucket limit

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  // Handle CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  let body: {
    passcode?: string
    slug?: string
    filename?: string
    contentType?: string
    size?: number
  }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const passcode = (body.passcode ?? '').trim()
  const slug = (body.slug ?? '').trim()
  const contentType = (body.contentType ?? '').trim().toLowerCase()
  const size = Number(body.size ?? 0)

  if (!passcode || !slug || !contentType) {
    return json(400, { error: 'Missing passcode, slug, or contentType' })
  }
  if (!ALLOWED.has(contentType)) {
    return json(400, {
      error: 'Unsupported file type. Use JPG, PNG, WebP, GIF, BMP, SVG, MP4, WebM or MOV.',
    })
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
    return json(400, { error: 'Invalid or too-large file (max 50 MB).' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeaders: Record<string, string> = {
    apikey: serviceKey,
    Authorization: 'Bearer ' + serviceKey,
    'Content-Type': 'application/json',
  }

  // 1. Validate the admin passcode (rate-limited on the DB side).
  const verifyRes = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_verify`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ p_passcode: passcode }),
  })
  if (!verifyRes.ok) {
    return json(401, { error: 'Unauthorized' })
  }

  // 2. Mint a signed upload URL for a random object path.
  const safeSlug =
    slug.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() ||
    'invitation'
  const ext = ALLOWED.get(contentType)!
  const objectPath = `${safeSlug}/${crypto.randomUUID()}.${ext}`

  const signRes = await fetch(
    `${supabaseUrl}/storage/v1/object/upload-sign/gallery/${objectPath}`,
    { method: 'POST', headers: authHeaders, body: '{}' }
  )
  if (!signRes.ok) {
    const detail = await signRes.text()
    return json(500, { error: 'Could not create upload URL: ' + detail })
  }
  const signData = await signRes.json()
  // signData.url is a relative path like "/storage/v1/object/upload-sign/gallery/...?token=XXX"
  const signedUrl = new URL(signData.url, supabaseUrl)
  const token = signedUrl.searchParams.get('token')
  if (!token) {
    return json(500, { error: 'No upload token returned by storage API.' })
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/gallery/${objectPath}`

  return json(200, {
    path: objectPath,
    token,
    publicUrl,
    contentType,
  })
})
