import { createClient } from '@supabase/supabase-js'

interface ApiRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
)

const ABANDON_AFTER_MINUTES = 60

/**
 * Runs on a Vercel Cron schedule (see vercel.json). Releases bookings stuck
 * in 'pending_deposit' past the payment window — the customer opened Stripe
 * Checkout but never completed it — so the inventory frees back up instead
 * of being held forever by an abandoned session.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const cutoff = new Date(Date.now() - ABANDON_AFTER_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('status', 'pending_deposit')
    .lt('created_at', cutoff)
    .select('id')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ released: data?.length ?? 0 })
}
