import { supabase } from './supabaseClient'
import type { Booking } from './bookings'

// ---------------------------------------------------------------------------
// Financials
// ---------------------------------------------------------------------------

/** Straight-line depreciation useful life. Walt can change this one number. */
export const USEFUL_LIFE_YEARS = 5

export const EXPENSE_CATEGORIES = [
  'fuel',
  'repairs',
  'new_inventory',
  'insurance',
  'subscriptions',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface Expense {
  id: string
  date: string
  category: string
  amount: number
  note: string | null
}

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Expense[]
}

export async function addExpense(e: Omit<Expense, 'id'>): Promise<void> {
  const { error } = await supabase.from('expenses').insert(e)
  if (error) throw error
}

export async function updateExpense(id: string, patch: Partial<Omit<Expense, 'id'>>): Promise<void> {
  const { error } = await supabase.from('expenses').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

/** Every non-cancelled booking with money attached — the financials working set. */
export async function fetchRevenueBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .in('status', ['confirmed', 'completed'])
    .order('event_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as Booking[]
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7) // YYYY-MM
}

/** Last `count` month keys ending at the current month, oldest first. */
export function lastMonthKeys(count: number): string[] {
  const keys: string[] = []
  const d = new Date()
  d.setDate(1)
  for (let i = 0; i < count; i++) {
    keys.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return keys
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface Review {
  id: string
  booking_id: string
  rating: number
  feedback_text: string
  submitted_at: string
  permission_to_share: boolean
  display_status: 'pending' | 'approved' | 'hidden'
}

export async function fetchReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Review[]
}

/**
 * Moderation is approve/hide ONLY — review text is never editable, so this
 * helper can only touch display_status.
 */
export async function setReviewDisplayStatus(
  id: string,
  displayStatus: 'approved' | 'hidden',
): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ display_status: displayStatus })
    .eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Demand signals
// ---------------------------------------------------------------------------

export interface DemandSignal {
  id: string
  date: string
  char_value: string | null
  finish: string | null
  requested_qty: number
  available_qty: number
  logged_on: string
}

export async function fetchDemandSignals(sinceDaysAgo = 90): Promise<DemandSignal[]> {
  const since = new Date()
  since.setDate(since.getDate() - sinceDaysAgo)
  const sinceIso = since.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('demand_signals')
    .select('*')
    .gte('logged_on', sinceIso)
    .order('logged_on', { ascending: false })
  if (error) throw error
  return (data ?? []) as DemandSignal[]
}

// ---------------------------------------------------------------------------
// Asset register
// ---------------------------------------------------------------------------

export interface AssetItem {
  id: string
  name: string
  category: string
  char_value: string | null
  finish: string | null
  price: number | null
  qty_owned: number
  active: boolean
  purchase_date: string | null
  purchase_cost: number | null
  condition: string
  replacement_cost: number | null
  last_maintenance_date: string | null
  maintenance_notes: string | null
  usage_count: number
}

export async function fetchAssets(): Promise<AssetItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('category')
    .order('name')
  if (error) throw error
  return (data ?? []) as AssetItem[]
}

export async function updateAsset(id: string, patch: Partial<AssetItem>): Promise<void> {
  const { error } = await supabase.from('inventory_items').update(patch).eq('id', id)
  if (error) throw error
}

/** Straight-line depreciated value of one unit; null when purchase data is missing. */
export function currentEstValue(item: AssetItem): number | null {
  if (item.purchase_cost == null) return null
  if (!item.purchase_date) return item.purchase_cost
  const ageYears =
    (Date.now() - new Date(`${item.purchase_date}T00:00:00`).getTime()) / (365.25 * 24 * 3600 * 1000)
  const remaining = Math.max(0, 1 - ageYears / USEFUL_LIFE_YEARS)
  return Math.round(item.purchase_cost * remaining * 100) / 100
}

// ---------------------------------------------------------------------------
// Transfer checklist
// ---------------------------------------------------------------------------

export interface ChecklistState {
  key: string
  checked: boolean
  checked_at: string | null
}

export async function fetchChecklist(): Promise<Map<string, ChecklistState>> {
  const { data, error } = await supabase.from('transfer_checklist').select('*')
  if (error) throw error
  return new Map(((data ?? []) as ChecklistState[]).map((row) => [row.key, row]))
}

export async function setChecklistItem(key: string, checked: boolean): Promise<void> {
  const { error } = await supabase.from('transfer_checklist').upsert({
    key,
    checked,
    checked_at: checked ? new Date().toISOString() : null,
  })
  if (error) throw error
}
