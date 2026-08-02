import { SPECIAL_SCHEDULING_LEAD_DAYS } from '../config/pricing'

/**
 * Customer-facing wording for availability outcomes.
 *
 * Deliberately kept free of any Supabase import so it can run in a Vercel
 * serverless function as well as the browser — `lib/availability.ts` reaches
 * for the Vite-only `import.meta.env` client, which throws server-side.
 * Phase 10's reply drafter needs this exact wording, and duplicating it is how
 * the two copies drift apart and one of them starts leaking fleet size.
 */

export interface ConflictItem {
  character: string
  available: boolean
}

export interface ConflictInput {
  date: string
  blocked: boolean
  blockReason: string | null
  items: ConflictItem[]
}

export function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** True when the date is far enough out to leave the door open. */
export function hasSpecialSchedulingLeadTime(dateStr: string): boolean {
  return daysUntil(dateStr) >= SPECIAL_SCHEDULING_LEAD_DAYS
}

/**
 * Human-readable summary of why a date isn't fully available, naming the
 * conflicting characters. Deliberately never reveals *why* an item is
 * unavailable (booked vs. a fleet quantity limit) — customer-facing copy
 * should never expose fleet size. With 14+ days of lead time the message
 * stays open-ended ("may need special scheduling") since there may be time
 * to work it out; under that, it's just "not available."
 */
export function describeConflicts(result: ConflictInput): string {
  if (result.blocked) return result.blockReason ?? 'This date is unavailable.'

  const conflicts = result.items.filter((i) => !i.available)
  if (conflicts.length === 0) return ''

  const chars = conflicts.map((c) => `"${c.character}"`).join(', ')
  const isPlural = conflicts.length > 1

  if (hasSpecialSchedulingLeadTime(result.date)) {
    return `The letter${isPlural ? 's' : ''} ${chars} may need special scheduling for that date — reach out and we'll confirm within 24 hours.`
  }

  return `The letter${isPlural ? 's' : ''} ${chars} ${isPlural ? 'are' : 'is'} not available for that date.`
}
