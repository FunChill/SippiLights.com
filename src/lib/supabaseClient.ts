import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your project credentials. Availability checks and form submission will fail until this is set.',
  )
}

// Falls back to a syntactically-valid placeholder so the client can always be
// constructed — pages that don't touch Supabase must keep working even when
// credentials aren't configured yet. Calls made with the placeholder simply
// fail at request time and are handled by each caller's existing error state.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
)
