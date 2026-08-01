// Single source of truth for checkout pricing/logistics constants.
// Deposit rule confirmed by Walt (2026): flat $20 for a single-marquee order,
// 25% of the marquee subtotal for 2+ marquees. NOT a flat percentage.

export const MARQUEE_PRICE = 70

export const SINGLE_MARQUEE_DEPOSIT = 20
export const MULTI_MARQUEE_DEPOSIT_PERCENT = 0.25

export const FREE_DELIVERY_RADIUS_MI = 25
export const MAX_RADIUS_MI = 50

// Lowered from 4 to 2 (Walt, 2026) — the travel fee below now carries the
// cost of the longer run, so the order minimum no longer has to.
export const MIN_MARQUEES_OUTSIDE_25 = 2

// Flat fee for the 26–50 mile zone. Flat rather than per-mile so the customer
// understands it instantly. Collected with the balance at delivery, NOT in the
// deposit — the deposit rule stays purely marquee-based.
// $35 confirmed by Walt (2026). Change this one constant to adjust it.
export const TRAVEL_FEE_BEYOND_25 = 35

export const HOME_BASE_ZIP = '39211'

// Below this many days of lead time, an unavailable item is just "not
// available." At or above it, the door stays open ("may need special
// scheduling") since there may be time to build/source/reallocate.
// Customer-facing wording must never reveal *why* something's unavailable.
export const SPECIAL_SCHEDULING_LEAD_DAYS = 14

/**
 * Deposit due now for a marquee order. 1 marquee = flat $20. 2+ marquees =
 * 25% of the marquee subtotal, rounded to the nearest dollar. Non-marquee
 * add-ons (LED Uplighting, Stage, 3D Arch) are priced at confirmation and
 * are not part of this automated calculation.
 */
export function calculateDeposit(marqueeCount: number, marqueeSubtotal: number): number {
  if (marqueeCount <= 0) return 0
  if (marqueeCount === 1) return SINGLE_MARQUEE_DEPOSIT
  return Math.round(marqueeSubtotal * MULTI_MARQUEE_DEPOSIT_PERCENT)
}

/**
 * Customers may pay more than the required minimum at booking — up to the
 * full order total. Returns the amount actually charged, clamped so it can
 * never fall below the minimum or exceed what's owed. Used on both sides:
 * the browser for display, the server as the authority.
 */
export function clampPaymentAmount(
  requested: number,
  minimumDue: number,
  orderTotal: number,
): number {
  if (!Number.isFinite(requested)) return minimumDue
  const rounded = Math.round(requested * 100) / 100
  if (rounded < minimumDue) return minimumDue
  if (rounded > orderTotal) return orderTotal
  return rounded
}

export type DeliveryZone = 'free' | 'requires-minimum' | 'out-of-area'

/** Travel fee for a distance. Free inside the delivery radius. */
export function calculateTravelFee(distanceMiles: number | null): number {
  if (distanceMiles === null) return 0
  if (distanceMiles <= FREE_DELIVERY_RADIUS_MI) return 0
  if (distanceMiles <= MAX_RADIUS_MI) return TRAVEL_FEE_BEYOND_25
  return 0 // out of area — not bookable online at all
}

/** Which delivery zone a distance falls into, and whether the current marquee count satisfies it. */
export function getDeliveryZone(distanceMiles: number): DeliveryZone {
  if (distanceMiles <= FREE_DELIVERY_RADIUS_MI) return 'free'
  if (distanceMiles <= MAX_RADIUS_MI) return 'requires-minimum'
  return 'out-of-area'
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}
