import { supabase } from './supabaseClient'

export type BookingStatus =
  | 'inquiry'
  | 'pending_deposit'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

export interface BookingItem {
  itemId: string
  character: string | null
  finish: string | null
  qty: number
  price: number | null
}

export interface Booking {
  id: string
  created_at: string
  event_date: string
  status: BookingStatus
  customer_name: string
  customer_phone: string
  customer_email: string
  event_type: string | null
  indoor_outdoor: string | null
  venue_address: string | null
  items: BookingItem[]
  word_built: string | null
  led_color: string | null
  subtotal: number | null
  deposit_due: number | null
  deposit_paid: boolean
  notes: string | null
  agreement_pdf_path: string | null
  balance_collected_at: string | null
  balance_payment_method: 'cash' | 'card' | 'other' | null
}

export const STATUS_COLORS: Record<BookingStatus, string> = {
  inquiry: '#9B72CF',
  pending_deposit: '#E8B54D',
  confirmed: '#5EDB8C',
  completed: '#7A8B99',
  cancelled: '#FF6B6B',
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  inquiry: 'Inquiry',
  pending_deposit: 'Pending Deposit',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export async function fetchBookingsInRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as Booking[]
}

export async function fetchInquiries() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'inquiry')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Booking[]
}

export async function updateBooking(id: string, patch: Partial<Booking>) {
  const { error } = await supabase.from('bookings').update(patch).eq('id', id)
  if (error) throw error
}

export async function getAgreementUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('agreements').createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}
