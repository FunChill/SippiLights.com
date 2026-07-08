import type { Finish } from '../data/inventory'
import type { AddOns, IndoorOutdoor } from '../context/CheckoutContext'

const KEY = 'sippilights-checkout-draft'

export interface CheckoutDraft {
  word: string
  colorId: string
  numberFinish: Finish
  eventDate: string
  addOns: AddOns
  indoorOutdoor: IndoorOutdoor
  weatherAck: boolean
  venueAddress: string
  zip: string
  name: string
  phone: string
  email: string
  eventType: string
}

/**
 * A real Stripe redirect is a full page unload — all in-memory React state
 * is gone by the time the browser comes back to /book?cancelled=1. This is
 * the only way to actually satisfy "cancel returns to review step with
 * order intact" rather than just resetting to a blank Step 1.
 */
export function saveDraft(draft: CheckoutDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — non-fatal, cancel just won't restore.
  }
}

export function loadDraft(): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CheckoutDraft) : null
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function isReturningFromCancelledCheckout(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('cancelled') === '1'
  )
}
