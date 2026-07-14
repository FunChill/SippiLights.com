import { track } from '@vercel/analytics'

/**
 * Funnel events — the five moments that turn a visitor into a booking.
 * Read docs/analytics.md for what each means and how to read the funnel.
 * All calls are fire-and-forget and safe to call anywhere; a blocked or
 * failed analytics script never affects the customer.
 */

let builderTracked = false

/** First character typed into the word builder this page load. */
export function trackBuilderUsed(): void {
  if (builderTracked) return
  builderTracked = true
  safeTrack('builder_used')
}

export function trackAvailabilityChecked(available: boolean): void {
  safeTrack('availability_checked', { result: available ? 'available' : 'unavailable' })
}

/** Customer accepted the agreement and clicked Reserve My Date. */
export function trackCheckoutStarted(): void {
  safeTrack('checkout_started')
}

/** Stripe redirected back to /book/confirmed — deposit paid. */
export function trackBookingCompleted(): void {
  safeTrack('booking_completed')
}

export function trackInquirySubmitted(): void {
  safeTrack('inquiry_submitted')
}

function safeTrack(event: string, data?: Record<string, string>): void {
  try {
    track(event, data)
  } catch {
    /* analytics must never break the site */
  }
}
