// DRAFT — Walt review + attorney review before production.
// Cancellation terms confirmed by Walt 2026-07-12; everything else drafted
// from the Phase 5 spec and existing site policy copy.

export interface AgreementSection {
  title: string
  body: string[]
}

export const AGREEMENT_VERSION = '2026-07-12-draft'

export const RENTAL_AGREEMENT: AgreementSection[] = [
  {
    title: 'Rental Period',
    body: [
      'Your rental covers one calendar day — the date of your event as selected at booking. Delivery, setup, and pickup are scheduled around your event and included in your rental; the rental period begins when setup is complete and ends when Sippi Lights returns for pickup.',
      'Extended or multi-day rentals are available by arrangement before your event date and may adjust pricing.',
    ],
  },
  {
    title: 'Delivery, Setup & Pickup',
    body: [
      'Sippi Lights personally delivers, sets up, and picks up every rental. You never assemble, wire, or move anything.',
      'Delivery is free within 25 miles of Jackson, MS (39211). Deliveries 26–50 miles out require a four-or-more marquee minimum. We do not deliver beyond 50 miles without prior arrangement.',
      'Someone 18 or older must be available at the venue to confirm placement at setup.',
    ],
  },
  {
    title: 'Care & Responsibility',
    body: [
      'From the time setup is complete until Sippi Lights returns for pickup, you are responsible for the rented items. Damage beyond normal use, or loss or theft of any item, will be billed at repair or replacement cost.',
      'Displays may not be moved, relocated, or repositioned by you or your guests after setup. If a display must be moved, call us and we will handle it.',
      'Keep displays away from open flames, sprinklers, and standing water. Marquee displays are electric — treat them like any other plugged-in appliance.',
    ],
  },
  {
    title: 'Power Requirements',
    body: [
      'A standard power outlet must be available within 25 feet of the setup location, indoors or outdoors. Approximately nine marquee characters can run on a single standard breaker.',
      'If adequate power is not available at setup and no alternative can be arranged on site, the rental may be treated as a same-day cancellation.',
    ],
  },
  {
    title: 'Outdoor Setups & Weather',
    body: [
      'Outdoor setups require a forecast rain chance under 20% and sustained winds under 10 mph for your event window.',
      'Sippi Lights may cancel or decline an outdoor setup for unsafe weather. When that happens, we will work with you to move the setup indoors or reschedule; if neither works, your deposit is refunded in full.',
    ],
  },
  {
    title: 'Cancellation Policy',
    body: [
      'Cancel 14 or more days before your event: your deposit is refunded in full.',
      'Cancel within 14 days of your event: your deposit converts to a credit toward a future booking. The credit is valid for 60 days from your original event date; after 60 days the credit is forfeited.',
    ],
  },
  {
    title: 'Payment Terms',
    body: [
      'A deposit is due at booking to reserve your date: $20 for a single-marquee order, or 25% of the marquee subtotal for orders of two or more marquees.',
      'The remaining balance is due at delivery, before setup begins. Add-on items (LED uplighting, stage, arches) are priced and confirmed with you before your event and follow the same balance-at-delivery terms.',
    ],
  },
]

export const AGREEMENT_INTRO =
  'This Rental Agreement is between you (the customer named below) and Sippi Lights, Jackson, MS. By checking the acceptance box at booking, you agree to the following terms for your rental.'
