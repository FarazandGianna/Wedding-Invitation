import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

function isUsableUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/**
 * True only when both env vars are present and the URL is well-formed.
 * Only the publishable (anon) key ever reaches the frontend — the
 * service-role key must never be set as a VITE_ variable.
 */
export const isSupabaseConfigured = Boolean(url && key && isUsableUrl(url))

if (!isSupabaseConfigured) {
  // Fail loudly in dev rather than silently breaking every query.
  console.error(
    'Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
  )
}

// When unconfigured we still create a client (against a harmless placeholder)
// so imports never throw; every real request will simply fail with an error
// the UI already handles.
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? (url as string) : 'http://localhost',
  key ?? 'public-anon-key',
  {
    auth: { persistSession: false }
  }
)
