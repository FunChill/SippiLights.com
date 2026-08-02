/**
 * Operations playbook — the SOPs that make Sippi Lights runnable by someone
 * who isn't Walt. Written for a new employee, subcontractor, or future owner:
 * no assumed knowledge, every step explicit. Rendered at /admin/playbook and
 * exportable to PDF per entry.
 */

export type PlaybookCategory =
  | 'Delivery'
  | 'Setup'
  | 'Teardown'
  | 'Damage/Incident'
  | 'Refund/Cancellation'
  | 'Customer Communication'
  | 'Weather Call'
  | 'Inventory Maintenance'

export interface PlaybookEntry {
  slug: string
  title: string
  category: PlaybookCategory
  steps: string[]
  notes?: string
}

export const PLAYBOOK: PlaybookEntry[] = [
  {
    slug: 'delivery-setup',
    title: 'Standard Delivery + Setup',
    category: 'Delivery',
    steps: [
      'The day before: open the booking in the dashboard (/admin), confirm the venue address, indoor/outdoor, the exact characters ordered, and the LED color. Text the customer a delivery window.',
      'Load the van: pull each character on the order, check every character lights fully before it leaves the shop (plug-in test, watch for dead LED segments), load padded side down, tallest items against the wall. Bring: extension cords (25ft minimum ×2), power strip, spare LED strip + connectors, zip ties, sandbags/weights for outdoor, gloves.',
      'On arrival: find the on-site contact (must be 18+, per the rental agreement). Walk the placement spot together BEFORE unloading. Confirm a standard outlet within 25 feet.',
      'Placement check: level ground, not blocking exits or walkways, away from sprinklers, open flames, and standing water. Outdoors: check overhead (no low branches/lines) and anchor every unit with weights.',
      'Assemble the display in order, plug in through the power strip, light it fully. Roughly nine characters max per standard breaker — split across outlets if the order is bigger.',
      'Collect the remaining balance BEFORE finishing (per the agreement: balance is due at delivery, before setup completes). Record it immediately in the dashboard: open the booking → select payment method → "Balance collected + completed".',
      'Photo everything lit, from the front, phone landscape. One for the customer, one for the portfolio folder.',
      'Before leaving, tell the contact: "Please don\'t move the letters — if anything needs to shift, call or text us at (601) 813-2464 and we\'ll handle it."',
    ],
    notes:
      'Delivery is free within 25 miles of Jackson (39211). 26–50 miles requires a 4+ marquee order. Never beyond 50 miles without prior arrangement.',
  },
  {
    slug: 'teardown-pickup',
    title: 'Teardown + Pickup',
    category: 'Teardown',
    steps: [
      'Arrive in the scheduled pickup window. Text the venue contact when 30 minutes out.',
      'Before touching anything: walk the display and photograph each unit, front and back. This is the condition record if damage is found.',
      'Unplug at the outlet first, then disassemble. Coil cords separately — never leave a cord attached to a unit in transit.',
      'Inspect each character as you load: LED strip fully lit, frame straight, finish unscratched. Any problem → follow "Damaged Item at Pickup" SOP before leaving the venue.',
      'Back at the shop: wipe each unit down, repair any dead LED segments now (not on the next delivery morning), and return each character to its labeled storage spot.',
      'Update the dashboard if anything needs repair: /admin/inventory → edit the item → set condition to "needs repair" with a note.',
    ],
  },
  {
    slug: 'damaged-item',
    title: 'Handling a Damaged Item at Pickup',
    category: 'Damage/Incident',
    steps: [
      'Photograph the damage in place, before moving the unit — multiple angles, close-up and full view.',
      'Show the on-site contact calmly and factually: "This unit has [damage]. Per the rental agreement, damage beyond normal use is billed at repair or replacement cost."',
      'Do NOT negotiate a price on the spot and do NOT accept cash on the spot. Say the owner will follow up with the repair/replacement quote within 2 business days.',
      'Same day: record it in the dashboard — open the booking, add the damage description and photo reference to the notes.',
      'Set the item\'s condition to "needs repair" (or "retired" if it\'s a loss) in /admin/inventory so it stops showing as available.',
      'Within 2 business days: get a repair quote or use the item\'s replacement cost from the asset register, and send the customer a written summary (email preferred — it\'s the paper trail) with the amount and payment instructions.',
    ],
    notes:
      'The rental agreement makes the customer responsible from setup-complete to pickup. Loss and theft bill at replacement cost. Stay friendly — most damage conversations go fine when the agreement was accepted at booking.',
  },
  {
    slug: 'cancellation-refund',
    title: 'Processing a Cancellation / Refund',
    category: 'Refund/Cancellation',
    steps: [
      'Count the days between today and the event date — this decides everything.',
      '14 OR MORE days out: full deposit refund. In Stripe: find the payment (search the customer email) → Refund → full amount. Then in the dashboard set the booking status to "cancelled" and note "refunded in full [date]".',
      'UNDER 14 days out: no refund — the deposit converts to a credit valid for 60 days from the ORIGINAL event date. Set status to "cancelled" and note: "credit $[amount], valid until [original event date + 60 days]".',
      'When a credit customer rebooks: create their new booking, and in notes reference the credit and the original booking. Collect only the difference if the new deposit exceeds the credit.',
      'After 60 days unused, the credit is forfeited (per the agreement). No action needed — the note documents it.',
      'Either path: reply to the customer the same day confirming what happened, in writing.',
    ],
    notes:
      'Weather cancellations are DIFFERENT: if Sippi Lights cancels an outdoor setup for unsafe weather and no indoor/reschedule works, the deposit is refunded in full regardless of timing. See the Weather Call SOP.',
  },
  {
    slug: 'weather-call',
    title: 'Making an Outdoor Weather Call',
    category: 'Weather Call',
    steps: [
      'Check the forecast for the event window 48 hours out, then again the morning of. Thresholds from the rental agreement: rain chance must be UNDER 20% and sustained wind UNDER 10 mph.',
      'Borderline forecast 48h out: call the customer now, not on event day. Offer the two options in order: (1) move the setup indoors at the same venue, (2) reschedule to a new date.',
      'If the morning-of forecast breaches thresholds and there is no indoor option: the setup does not happen. This is a safety and equipment decision — wind tips 4-foot letters.',
      'If Sippi Lights cancels for weather and neither indoor nor reschedule works: refund the deposit IN FULL (Stripe → Refund), set status "cancelled", note "weather cancellation — full refund".',
      'Text the customer the decision as early as possible on event day. Early bad news is service; late bad news is a complaint.',
    ],
  },
  {
    slug: 'customer-communication',
    title: 'Customer Communication Standards',
    category: 'Customer Communication',
    steps: [
      'Tone, always: casually friendly, excited for their event. These are birthdays, weddings, graduations — match the energy.',
      'Response time targets: new inquiry within 24 hours (the auto-reply promises this). Booking questions same day. Day-of-event messages immediately.',
      'Every inquiry gets answered even if the date is unavailable — offer the nearest available date instead of a flat no.',
      'NEVER tell a customer how many of an item we own, or that we "don\'t have enough". The words are: "not available for that date" or, with 14+ days lead, "may need special scheduling — reach out and we\'ll confirm within 24 hours".',
      'Confirmations, cancellations, damage follow-ups, and anything involving money go in WRITING (email), even if it was agreed on a call first.',
      'The system emails automatically: booking confirmation (instant), reminder (3 days before), thank-you + feedback ask (1 day after). Don\'t duplicate these manually.',
    ],
  },
  {
    slug: 'onboarding-helper',
    title: 'Onboarding a New Employee / Subcontractor for Deliveries',
    category: 'Setup',
    steps: [
      'Ride-along one: they watch a full delivery + setup, start to finish. Give them the Delivery + Setup SOP printed (export the PDF from /admin/playbook).',
      'Ride-along two: they lead, you watch. They run the placement walk, the breaker math, the balance collection, and the "don\'t move the letters" script.',
      'Teach the two non-negotiables: (1) balance is collected BEFORE setup completes, recorded in the dashboard on the spot; (2) the customer-facing availability language — never mention fleet counts.',
      'Show them the dashboard on their phone: finding the day\'s booking, the venue address, marking balance collected. That is the only admin access a delivery person needs.',
      'Give them: the van loading checklist (in the Delivery SOP), the shop address and storage layout, and the owner\'s number for day-of exceptions.',
      'They\'re solo-ready when they can run a two-word setup without a question. Until then, they don\'t make weather calls or damage calls — those stay with the owner.',
    ],
    notes:
      'Subcontractors sign a simple agreement (rate, insurance, no direct solicitation of Sippi Lights customers) BEFORE the first ride-along. Keep a signed copy in the records folder.',
  },
  {
    slug: 'inventory-maintenance',
    title: 'Routine Inventory Maintenance',
    category: 'Inventory Maintenance',
    steps: [
      'Monthly (first Monday): plug-test every character in storage. Repair dead LED segments immediately from spare strip; reorder strip and connectors when running low.',
      'Wipe-down and frame inspection at every teardown (see Teardown SOP) — maintenance is continuous, not seasonal.',
      'After each monthly check, update /admin/inventory: set "last maintenance" to today on anything you touched, and adjust condition honestly — the asset register is only worth what it reflects.',
      'Watch the "Most-Requested Unavailable" widget on /admin/inventory — that list is what customers wanted and couldn\'t book. It is the shopping list, ranked by demand.',
      'Retiring an item: condition "retired" AND active off, so it leaves the booking flow. Note why (damaged beyond repair / sold / lost).',
      'New purchases: add purchase date and cost the day they arrive — depreciation and the asset value number depend on it.',
    ],
  },
]

export const PLAYBOOK_CATEGORIES: PlaybookCategory[] = [
  'Delivery',
  'Setup',
  'Teardown',
  'Damage/Incident',
  'Refund/Cancellation',
  'Customer Communication',
  'Weather Call',
  'Inventory Maintenance',
]
