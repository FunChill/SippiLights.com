import type { Booking } from './bookings'

/**
 * Where a customer stands, at a glance.
 *
 * Stages are DERIVED, never hand-maintained. A manual stage field goes stale
 * exactly when it matters most — the busy week — so every stage here is read
 * from things that already happened: a reply sent, a deposit paid, an event
 * delivered. The one exception is the waitlist flag, which records a customer's
 * answer and genuinely cannot be inferred.
 */
export type Stage = 'lead' | 'quoted' | 'reserved' | 'paid_in_full' | 'delivered' | 'closed'

export const STAGE_ORDER: Stage[] = [
  'lead',
  'quoted',
  'reserved',
  'paid_in_full',
  'delivered',
  'closed',
]

export const STAGE_LABELS: Record<Stage, string> = {
  lead: 'Lead',
  quoted: 'Quoted',
  reserved: 'Reserved',
  paid_in_full: 'Paid in full',
  delivered: 'Delivered',
  closed: 'Closed',
}

/** Gold as money gets closer; grey once the customer is done or gone. */
export const STAGE_COLORS: Record<Stage, string> = {
  lead: 'border-gold/30 bg-gold/5 text-gold/90',
  quoted: 'border-gold/50 bg-gold/10 text-gold',
  reserved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  paid_in_full: 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200',
  delivered: 'border-text-muted/30 bg-charcoal text-text-muted',
  closed: 'border-red-500/25 bg-red-500/5 text-red-300/70',
}

/**
 * @param hasOutboundReply whether a reply has actually gone out to them —
 * the difference between a lead nobody has answered and a quote awaiting
 * their decision.
 */
export function deriveStage(booking: Booking, hasOutboundReply: boolean): Stage {
  if (booking.status === 'cancelled') return 'closed'
  if (booking.status === 'completed') return 'delivered'
  if (booking.paid_in_full) return 'paid_in_full'
  // A paid deposit is the moment the date is actually theirs.
  if (booking.status === 'confirmed' || booking.deposit_paid) return 'reserved'
  // Started checkout but hasn't paid — they've seen a real number.
  if (booking.status === 'pending_deposit') return 'quoted'
  return hasOutboundReply ? 'quoted' : 'lead'
}

/**
 * What's still missing before this booking can actually be delivered. A flag
 * rather than a stage, because it applies across several stages at once — and
 * it is precisely what the pre-event follow-up exists to close.
 */
export function infoNeeded(booking: Booking): string[] {
  const gaps: string[] = []
  if (!booking.event_date) gaps.push('event date')
  if (!booking.customer_phone?.trim()) gaps.push('phone number')
  if (!booking.venue_address?.trim()) gaps.push('venue address')
  // Indoor/outdoor drives the weather call, so it matters well before the day.
  if (!booking.indoor_outdoor) gaps.push('indoor or outdoor')
  return gaps
}

export interface PipelineEntry {
  booking: Booking
  stage: Stage
  gaps: string[]
  waitlisted: boolean
}

export function buildPipeline(
  bookings: Booking[],
  repliedIds: Set<string>,
): PipelineEntry[] {
  return bookings.map((booking) => ({
    booking,
    stage: deriveStage(booking, repliedIds.has(booking.id)),
    gaps: infoNeeded(booking),
    waitlisted: booking.waitlist_requested === true,
  }))
}

export function countByStage(entries: PipelineEntry[]): Record<Stage, number> {
  const counts = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0])) as Record<Stage, number>
  for (const e of entries) counts[e.stage]++
  return counts
}
