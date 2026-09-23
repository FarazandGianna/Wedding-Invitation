// Edge Function: upload-gallery-photo
//
// Accepts a file directly from the admin browser and uploads it to the
// gallery storage bucket using the service role key. The browser sends
// the admin passcode + slug via headers and the file as the request body.
//
// Deploy with verify_jwt = false — this function's auth is the passcode.

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
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-passcode, x-slug, x-content-type',
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

  // Passcode and metadata come via headers; the file is the request body.
  const passcode = (req.headers.get('x-passcode') ?? '').trim()
  const slug = (req.headers.get('x-slug') ?? '').trim()
  const contentType = (req.headers.get('x-content-type') ?? '').trim().toLowerCase()

  if (!passcode || !slug || !contentType) {
    return json(400, { error: 'Missing x-passcode, x-slug, or x-content-type header' })
  }
  if (!ALLOWED.has(contentType)) {
    return json(400, {
      error: 'Unsupported file type. Use JPG, PNG, WebP, GIF, BMP, SVG, MP4, WebM or MOV.',
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeaders: Record<string, string> = {
    apikey: serviceKey,
    Authorization: 'Bearer ' + serviceKey,
  }

  // 1. Validate the admin passcode (rate-limited on the DB side).
  const verifyRes = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_verify`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_passcode: passcode }),
  })
  if (!verifyRes.ok) {
    return json(401, { error: 'Unauthorized' })
  }

  // 2. Read the file from the request body.
  const fileBuffer = await req.arrayBuffer()
  if (fileBuffer.byteLength === 0) {
    return json(400, { error: 'Empty file body' })
  }
  if (fileBuffer.byteLength > MAX_BYTES) {
    return json(400, { error: 'File exceeds 50 MB limit.' })
  }

  // 3. Upload directly to the gallery storage bucket using the service role key.
  const safeSlug =
    slug.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() ||
    'invitation'
  const ext = ALLOWED.get(contentType)!
  const objectPath = `${safeSlug}/${crypto.randomUUID()}.${ext}`

  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/gallery/${objectPath}`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      body: fileBuffer,
    }
  )

  if (!uploadRes.ok) {
    const detail = await uploadRes.text()
    return json(500, { error: 'Upload failed: ' + detail })
  }

  // 4. Return the public URL and path.
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/gallery/${objectPath}`

  return json(200, {
    path: objectPath,
    publicUrl,
    contentType,
  })
})
