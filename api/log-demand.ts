import { supabaseAdmin } from './_lib/supabaseAdmin.js'

interface ApiRequest {
  method?: string
  body: unknown
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

interface DemandBody {
  date?: string
  signals?: Array<{
    character?: string
    finish?: string
    requestedQty?: number
    availableQty?: number
  }>
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Records "customer wanted X but it wasn't available" events so the owner can
 * see which items to buy next. Deduplicated to one row per (event date,
 * character, finish) per calendar day by the unique index — builder keystroke
 * storms collapse into a single daily signal. Fire-and-forget from the client;
 * losses are acceptable, this is a buying signal, not an audit log.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { date, signals } = (req.body ?? {}) as DemandBody

  if (!date || !DATE_RE.test(date) || !Array.isArray(signals) || signals.length === 0) {
    return res.status(400).json({ error: 'Missing date or signals.' })
  }

  const rows = signals
    .slice(0, 40) // hard cap — no word is longer than this
    .filter((s) => typeof s.character === 'string' && s.character.length === 1)
    .map((s) => ({
      date,
      char_value: s.character!.toUpperCase(),
      finish: s.finish === 'black' ? 'black' : 'white',
      requested_qty: Math.max(1, Math.min(20, Number(s.requestedQty) || 1)),
      available_qty: Math.max(0, Math.min(20, Number(s.availableQty) || 0)),
    }))

  if (rows.length === 0) {
    return res.status(400).json({ error: 'No valid signals.' })
  }

  // Ignore duplicates from the same day rather than erroring.
  const { error } = await supabaseAdmin
    .from('demand_signals')
    .upsert(rows, { onConflict: 'date,char_value,finish,logged_on', ignoreDuplicates: true })

  if (error) {
    return res.status(500).json({ error: 'Could not record.' })
  }
  return res.status(200).json({ ok: true })
}
