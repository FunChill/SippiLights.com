import { supabase } from './supabaseClient'
import type { Finish } from '../data/inventory'
// Conflict wording lives in availabilityWording.ts so the Phase 10 reply
// drafter can reuse it server-side; this module's Supabase import is
// browser-only. Re-exported here so existing callers are unaffected.
export { describeConflicts, daysUntil, hasSpecialSchedulingLeadTime } from './availabilityWording'

export interface RequestedItem {
  character: string
  finish: Finish
  qty: number
}

export interface ItemAvailability extends RequestedItem {
  bookedQty: number
  ownedQty: number
  available: boolean
}

export interface AvailabilityResult {
  date: string
  blocked: boolean
  blockReason: string | null
  items: ItemAvailability[]
  allAvailable: boolean
}

/** Live owned-quantity lookup by character+finish, read straight from Supabase so Walt can update counts in the database without a code change. */
async function getOwnedQtyMap(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('char_value, finish, qty_owned')
    .not('char_value', 'is', null)

  if (error) throw error

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    if (!row.char_value) continue
    map.set(`${row.char_value.toUpperCase()}-${row.finish}`, row.qty_owned)
  }
  return map
}

/** Collapses a typed word into one requested item per unique character+finish, summing repeats (e.g. "HAPPY" needs 2 white "P"s). */
export function wordToRequestedItems(word: string, numberFinish: Finish): RequestedItem[] {
  const byKey = new Map<string, RequestedItem>()

  for (const char of word) {
    if (char === ' ') continue
    const isDigit = /^[0-9]$/.test(char)
    const finish: Finish = isDigit ? numberFinish : 'white'
    const character = char.toUpperCase()
    const key = `${character}-${finish}`
    const existing = byKey.get(key)
    if (existing) {
      existing.qty += 1
    } else {
      byKey.set(key, { character, finish, qty: 1 })
    }
  }

  return [...byKey.values()]
}

// NOTE: there is deliberately no "which dates have bookings" lookup here.
// Exposing that to customers reveals how busy the schedule is, which is
// nobody's business and helps no one book. Availability is answered per
// item at the point the customer names their word and date.

/** Manually-blocked dates (holidays, maintenance) within [startDate, endDate] — for shading a calendar. */
export async function getBlockedDatesInRange(
  startDate: string,
  endDate: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('availability_blocks')
    .select('date')
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error
  return new Set((data ?? []).map((row) => row.date))
}

/** Lightweight check for whether a date is manually blocked (holiday, maintenance) — no character-level detail. */
export async function checkDateBlocked(
  date: string,
): Promise<{ blocked: boolean; reason: string | null }> {
  const { data, error } = await supabase
    .from('availability_blocks')
    .select('reason')
    .eq('date', date)
    .maybeSingle()

  if (error) throw error
  return { blocked: !!data, reason: data?.reason ?? null }
}

export async function checkAvailability(
  date: string,
  requestedItems: RequestedItem[],
): Promise<AvailabilityResult> {
  const { data: block, error: blockError } = await supabase
    .from('availability_blocks')
    .select('reason')
    .eq('date', date)
    .maybeSingle()

  if (blockError) throw blockError

  if (block) {
    const ownedMap = await getOwnedQtyMap()
    return {
      date,
      blocked: true,
      blockReason: block.reason ?? 'This date is unavailable.',
      items: requestedItems.map((r) => ({
        ...r,
        bookedQty: 0,
        ownedQty: ownedMap.get(`${r.character}-${r.finish}`) ?? 0,
        available: false,
      })),
      allAvailable: false,
    }
  }

  const [{ data: booked, error: bookedError }, ownedMap] = await Promise.all([
    supabase.rpc('get_booked_quantities', { check_date: date }),
    getOwnedQtyMap(),
  ])

  if (bookedError) throw bookedError

  const bookedMap = new Map<string, number>()
  for (const row of booked ?? []) {
    bookedMap.set(`${row.char_value}-${row.finish}`, row.qty)
  }

  const items: ItemAvailability[] = requestedItems.map((r) => {
    const bookedQty = bookedMap.get(`${r.character}-${r.finish}`) ?? 0
    const ownedQty = ownedMap.get(`${r.character}-${r.finish}`) ?? 0
    return { ...r, bookedQty, ownedQty, available: ownedQty - bookedQty >= r.qty }
  })

  return {
    date,
    blocked: false,
    blockReason: null,
    items,
    allAvailable: items.every((i) => i.available),
  }
}

/**
 * Fire-and-forget demand logging: whenever a check finds items unavailable,
 * tell the server so the owner sees what to buy next. Server dedupes to one
 * row per item per day, so calling this on every check is safe.
 */
export function logDemandSignals(result: AvailabilityResult): void {
  if (result.blocked) return
  const misses = result.items.filter((i) => !i.available)
  if (misses.length === 0) return

  const payload = {
    date: result.date,
    signals: misses.map((m) => ({
      character: m.character,
      finish: m.finish,
      requestedQty: m.qty,
      availableQty: Math.max(0, m.ownedQty - m.bookedQty),
    })),
  }

  fetch('/api/log-demand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* buying signal, not an audit log — losses are fine */
  })
}
