import { supabase } from './supabaseClient'

export type Triage = 'qualified' | 'question' | 'out_of_area' | 'spam' | 'scam'

export interface DraftResult {
  triage: Triage
  triageReason: string
  draft: string
  missingInfo: string[]
  warnings: string[]
  factSheet: string
}

export const TRIAGE_LABELS: Record<Triage, string> = {
  qualified: 'Qualified lead',
  question: 'Question',
  out_of_area: 'Out of area',
  spam: 'Spam',
  scam: 'Scam',
}

/** Gold for money, amber for caution, red for danger, grey for noise. */
export const TRIAGE_COLORS: Record<Triage, string> = {
  qualified: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  question: 'border-gold/40 bg-gold/10 text-gold',
  out_of_area: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  spam: 'border-text-muted/30 bg-charcoal text-text-muted',
  scam: 'border-red-500/50 bg-red-500/15 text-red-300',
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
  }
}

/**
 * Latest triage verdict per booking, so obvious spam is visible in the list
 * without opening it. Best-effort: an empty map just means no badges.
 */
export async function fetchTriageByBooking(): Promise<Map<string, Triage>> {
  const { data, error } = await supabase
    .from('inquiry_messages')
    .select('booking_id, triage, created_at')
    .not('booking_id', 'is', null)
    .not('triage', 'is', null)
    .order('created_at', { ascending: false })

  if (error) return new Map()

  const map = new Map<string, Triage>()
  for (const row of data ?? []) {
    // Ordered newest-first, so the first verdict seen per booking wins.
    if (row.booking_id && !map.has(row.booking_id)) {
      map.set(row.booking_id, row.triage as Triage)
    }
  }
  return map
}

export async function draftReply(input: {
  message: string
  bookingId?: string
  eventDate?: string
  zip?: string
  items?: { character: string; finish: string; qty: number }[]
  channel?: string
}): Promise<DraftResult> {
  const res = await fetch('/api/draft-reply', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Could not draft a reply.')
  return data as DraftResult
}

export async function sendReply(input: {
  to: string
  subject: string
  body: string
  bookingId?: string
}): Promise<void> {
  const res = await fetch('/api/send-reply', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Could not send the reply.')
}
