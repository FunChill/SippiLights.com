import { createClient } from '@supabase/supabase-js'

// Placeholders let the client construct when env vars are absent instead of
// throwing at import time. A module-level throw here takes down every function
// that imports this file — the same failure that once 500'd the whole API —
// and it also makes the pure helpers in this folder untestable without
// credentials. Calls still fail loudly at runtime if the config is wrong.
export const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || 'https://not-configured.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'not-configured',
)
