import { supabase } from './supabaseClient'
import type { Finish } from '../data/inventory'

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

/** Human-readable summary of why a date isn't fully available, naming the conflicting characters. */
export function describeConflicts(result: AvailabilityResult): string {
  if (result.blocked) return result.blockReason ?? 'This date is unavailable.'

  const conflicts = result.items.filter((i) => !i.available)
  if (conflicts.length === 0) return ''

  const chars = conflicts.map((c) => `"${c.character}"`).join(', ')
  const isPlural = conflicts.length > 1
  return `The letter${isPlural ? 's' : ''} ${chars} ${isPlural ? 'are' : 'is'} booked that date.`
}
