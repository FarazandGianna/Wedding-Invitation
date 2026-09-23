import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Treat empty strings (what CI passes when a secret/env var is absent) the
// same as a missing value — otherwise createClient would throw at startup.
const url = import.meta.env.VITE_SUPABASE_URL?.trim() || undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || undefined

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
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example).'
  )
}

// When unconfigured we still create a client (against a harmless placeholder)
// so imports never throw; the UI shows the "not set up yet" screen and no
// requests are made.
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? (url as string) : 'https://placeholder.invalid',
  key ?? 'public-anon-key',
  {
    auth: { persistSession: false }
  }
)
