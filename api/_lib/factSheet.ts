import { supabaseAdmin } from './supabaseAdmin.js'
import {
  MARQUEE_PRICE,
  MIN_MARQUEES_OUTSIDE_25,
  FREE_DELIVERY_RADIUS_MI,
  MAX_RADIUS_MI,
  TRAVEL_FEE_BEYOND_25,
  SPECIAL_SCHEDULING_LEAD_DAYS,
  calculateDeposit,
  calculateTravelFee,
  getDeliveryZone,
  formatCurrency,
} from '../../src/config/pricing.js'
import { estimateDistanceMiles } from '../../src/data/zipDistances.js'
import {
  describeConflicts,
  hasSpecialSchedulingLeadTime,
  daysUntil,
} from '../../src/lib/availabilityWording.js'
import { FAQ_ITEMS } from '../../src/content/faq.js'

/**
 * Assembles the authoritative answer to everything an inquiry can ask.
 *
 * THE MODEL NEVER COMPUTES. It is handed this sheet and phrases it. Every
 * number here comes from the same code that runs checkout, so a drafted reply
 * cannot quote a price, a fee, or an availability that the booking flow would
 * contradict. If a fact is not on the sheet, the drafter must say it doesn't
 * know rather than fill the gap.
 *
 * There is no AI in this file, on purpose. It is the trustworthy half.
 */

export interface FactSheetInput {
  /** Optional: pull details from an existing booking/inquiry row. */
  bookingId?: string
  /** Loose inputs when there's no booking yet (e.g. a Messenger message). */
  eventDate?: string
  zip?: string
  items?: { character: string; finish: string; qty: number }[]
}

export interface FactSheetFact {
  label: string
  value: string
}

/**
 * A figure the drafter may state, tagged with what it actually IS. The role
 * matters: $35 can be a legitimate deposit AND a legitimate travel fee in the
 * same quote, and a draft that swaps them is wrong even though both numbers
 * appear on the sheet.
 */
export type AmountRole = 'per-marquee' | 'subtotal' | 'deposit' | 'travel-fee' | 'already-paid'

export interface AllowedAmount {
  value: number
  role: AmountRole
}

export interface FactSheet {
  /** Rendered for the prompt. */
  text: string
  /** Machine-readable, for validating the draft afterwards. */
  facts: FactSheetFact[]
  /** Every dollar figure the drafter is permitted to state, with its role. */
  allowedAmounts: AllowedAmount[]
  /** Every date the drafter is permitted to state, ISO form. */
  allowedDates: string[]
  /** Things we could not determine — the drafter must not invent these. */
  unknowns: string[]
}

interface BookingRow {
  id: string
  event_date: string
  status: string
  customer_name: string
  event_type: string | null
  indoor_outdoor: string | null
  venue_address: string | null
  items: { character: string; finish: string; qty: number }[] | null
  word_built: string | null
  subtotal: number | null
  deposit_due: number | null
  amount_paid: number | null
  paid_in_full: boolean | null
  notes: string | null
}

async function loadBooking(bookingId: string): Promise<BookingRow | null> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, event_date, status, customer_name, event_type, indoor_outdoor, venue_address, items, word_built, subtotal, deposit_due, amount_paid, paid_in_full, notes',
    )
    .eq('id', bookingId)
    .maybeSingle()

  if (error) throw error
  return (data as BookingRow | null) ?? null
}

/**
 * Server-side availability. Mirrors src/lib/availability.ts, which cannot be
 * imported here because it pulls in the Vite-only browser Supabase client.
 */
async function checkAvailabilityServerSide(
  date: string,
  requested: { character: string; finish: string; qty: number }[],
) {
  const { data: block, error: blockError } = await supabaseAdmin
    .from('availability_blocks')
    .select('reason')
    .eq('date', date)
    .maybeSingle()
  if (blockError) throw blockError

  const { data: inventory, error: invError } = await supabaseAdmin
    .from('inventory_items')
    .select('char_value, finish, qty_owned')
    .not('char_value', 'is', null)
  if (invError) throw invError

  const owned = new Map<string, number>()
  for (const row of inventory ?? []) {
    if (!row.char_value) continue
    owned.set(`${String(row.char_value).toUpperCase()}-${row.finish}`, row.qty_owned)
  }

  if (block) {
    return {
      date,
      blocked: true,
      blockReason: (block.reason as string) ?? 'This date is unavailable.',
      items: requested.map((r) => ({ ...r, available: false })),
      allAvailable: false,
    }
  }

  const { data: booked, error: bookedError } = await supabaseAdmin.rpc(
    'get_booked_quantities',
    { check_date: date },
  )
  if (bookedError) throw bookedError

  const bookedMap = new Map<string, number>()
  for (const row of booked ?? []) {
    bookedMap.set(`${row.char_value}-${row.finish}`, row.qty)
  }

  const items = requested.map((r) => {
    const key = `${r.character.toUpperCase()}-${r.finish}`
    const free = (owned.get(key) ?? 0) - (bookedMap.get(key) ?? 0)
    return { ...r, available: free >= r.qty }
  })

  return {
    date,
    blocked: false,
    blockReason: null,
    items,
    allAvailable: items.every((i) => i.available),
  }
}

export async function buildFactSheet(input: FactSheetInput): Promise<FactSheet> {
  const facts: FactSheetFact[] = []
  const unknowns: string[] = []
  const allowedAmounts: AllowedAmount[] = []
  const allowedDates: string[] = []
  const allow = (value: number, role: AmountRole) => allowedAmounts.push({ value, role })

  const booking = input.bookingId ? await loadBooking(input.bookingId) : null

  const eventDate = booking?.event_date ?? input.eventDate ?? null
  const items = (booking?.items ?? input.items ?? []).map((i) => ({
    character: String(i.character).toUpperCase(),
    finish: i.finish,
    qty: Number(i.qty) || 0,
  }))
  const marqueeCount = items.reduce((sum, i) => sum + i.qty, 0)

  // --- Who / what ------------------------------------------------------
  if (booking) {
    facts.push({ label: 'Customer', value: booking.customer_name })
    facts.push({ label: 'Booking status', value: booking.status })
    if (booking.word_built) {
      facts.push({ label: 'Word requested', value: booking.word_built })
    }
    if (booking.event_type) {
      facts.push({ label: 'Event type', value: booking.event_type })
    }
    if (booking.indoor_outdoor) {
      facts.push({ label: 'Indoor or outdoor', value: booking.indoor_outdoor })
    }
  }

  // --- Date + availability ---------------------------------------------
  if (eventDate) {
    allowedDates.push(eventDate)
    const lead = daysUntil(eventDate)
    facts.push({ label: 'Event date', value: eventDate })
    facts.push({ label: 'Days until event', value: String(lead) })

    if (lead < 0) {
      facts.push({
        label: 'Date warning',
        value: 'This date is in the past. Do not quote availability; ask the customer to confirm the date.',
      })
    } else if (marqueeCount > 0) {
      try {
        const availability = await checkAvailabilityServerSide(eventDate, items)
        facts.push({
          label: 'Availability',
          value: availability.allAvailable
            ? 'Everything requested is available for that date.'
            : describeConflicts(availability),
        })
        if (!availability.allAvailable) {
          facts.push({
            label: 'When something is unavailable',
            value:
              'Do NOT propose a specific alternative date — that is Walt\'s call, not yours. ' +
              'Instead ask whether they would like us to reach out if that date opens up ' +
              '(reservations do sometimes move or cancel). Frame it as an offer, never as a ' +
              'promise, and never imply anything is being held for them.',
          })
        }
        facts.push({
          label: 'Availability wording rule',
          value:
            'Use the sentence above as-is or paraphrase it closely. NEVER say why something is unavailable — not "already booked", not a quantity. ' +
            (hasSpecialSchedulingLeadTime(eventDate)
              ? `This date is ${SPECIAL_SCHEDULING_LEAD_DAYS}+ days out, so unavailable items are "may need special scheduling", never a flat no.`
              : `This date is inside ${SPECIAL_SCHEDULING_LEAD_DAYS} days, so unavailable items are simply "not available".`),
        })
      } catch {
        unknowns.push('Live availability could not be checked — do not state whether the date is open.')
      }
    } else {
      unknowns.push('No specific letters requested yet, so availability was not checked.')
    }
  } else {
    unknowns.push('No event date given — do not guess one, ask for it.')
  }

  // --- Pricing ----------------------------------------------------------
  facts.push({
    label: 'Price per marquee',
    value: `${formatCurrency(MARQUEE_PRICE)} per marquee, per event day`,
  })
  allow(MARQUEE_PRICE, 'per-marquee')

  if (marqueeCount > 0) {
    const marqueeSubtotal = marqueeCount * MARQUEE_PRICE
    const deposit = calculateDeposit(marqueeCount, marqueeSubtotal)
    facts.push({ label: 'Marquee count', value: String(marqueeCount) })
    facts.push({ label: 'Marquee subtotal', value: formatCurrency(marqueeSubtotal) })
    facts.push({
      label: 'Deposit due to reserve',
      value: `${formatCurrency(deposit)} (flat $20 for one marquee, 25% of the marquee subtotal for two or more)`,
    })
    allow(marqueeSubtotal, 'subtotal')
    allow(deposit, 'deposit')
  } else {
    unknowns.push('No marquee count yet — do not quote a total or a deposit.')
  }

  // --- Delivery zone ----------------------------------------------------
  const zip = input.zip ?? null
  const distance = zip ? estimateDistanceMiles(zip) : null

  if (zip && distance !== null) {
    const zone = getDeliveryZone(distance)
    const travelFee = calculateTravelFee(distance)
    facts.push({ label: 'Customer ZIP', value: zip })
    facts.push({ label: 'Approx. distance', value: `${distance} miles` })

    if (zone === 'free') {
      facts.push({
        label: 'Delivery',
        value: `Inside the ${FREE_DELIVERY_RADIUS_MI}-mile radius. Delivery, setup, and pickup are included at no extra charge.`,
      })
    } else if (zone === 'requires-minimum') {
      facts.push({
        label: 'Delivery',
        value:
          `Between ${FREE_DELIVERY_RADIUS_MI} and ${MAX_RADIUS_MI} miles. A flat ${formatCurrency(travelFee)} travel fee applies, ` +
          `and this zone requires a minimum of ${MIN_MARQUEES_OUTSIDE_25} marquees.`,
      })
      facts.push({
        label: 'Travel fee rule',
        value:
          'The travel fee is collected with the balance at delivery — it is NEVER part of the deposit. ' +
          'The deposit stays purely marquee-based.',
      })
      allow(travelFee, 'travel-fee')
      if (marqueeCount > 0 && marqueeCount < MIN_MARQUEES_OUTSIDE_25) {
        facts.push({
          label: 'Minimum not met',
          value: `Customer requested ${marqueeCount} marquee(s) but this distance requires ${MIN_MARQUEES_OUTSIDE_25}. Say so plainly and offer to add another.`,
        })
      }
    } else {
      facts.push({
        label: 'Delivery',
        value:
          `Over ${MAX_RADIUS_MI} miles — outside the service area and NOT bookable online. ` +
          'Do not quote a price or a travel fee. Hand this to Walt.',
      })
      facts.push({
        label: 'Out-of-area reply rule',
        value:
          'Decline politely and thank them for checking with us. Do NOT refer them to a ' +
          'competitor, do NOT suggest we might make an exception, and do NOT quote anything. ' +
          'Warm, brief, and final — they took the time to ask, so the no should feel gracious.',
      })
    }
  } else if (zip) {
    unknowns.push(`ZIP ${zip} is not in the distance table — do not state a travel fee or whether it is in range.`)
  } else {
    unknowns.push('No ZIP or address given — do not state delivery cost or whether it is in range.')
  }

  // --- Standing rules ---------------------------------------------------
  facts.push({
    label: 'Add-ons',
    value:
      'LED Uplighting, Stage, and 3D Arch are priced at confirmation. NEVER quote a number for these.',
  })
  facts.push({
    label: 'Lighting',
    value:
      'Marquees are lit with LED STRIP lighting, not bulbs. Never write "bulbs". ' +
      'The colour adjusts to the customer\'s theme. Letters are classic white; ' +
      'numbers come in black or white.',
  })
  facts.push({
    label: 'Setup timing',
    value: 'Prior-day setup is available at no extra charge.',
  })
  facts.push({
    label: 'Holds',
    value:
      'Nothing is reserved until a deposit is paid. A saved inquiry holds no inventory. Never imply a date is being held.',
  })

  // --- Existing booking money -------------------------------------------
  if (booking) {
    if (booking.subtotal !== null) allow(Number(booking.subtotal), 'subtotal')
    if (booking.deposit_due !== null) allow(Number(booking.deposit_due), 'deposit')
    if (booking.amount_paid !== null) {
      allow(Number(booking.amount_paid), 'already-paid')
      facts.push({
        label: 'Already paid',
        value: booking.paid_in_full
          ? `${formatCurrency(Number(booking.amount_paid))} — PAID IN FULL, no balance due at delivery.`
          : `${formatCurrency(Number(booking.amount_paid))} paid so far.`,
      })
    }
  }

  // --- FAQ --------------------------------------------------------------
  const faq = FAQ_ITEMS.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')

  const text = [
    '=== AUTHORITATIVE FACTS ===',
    'Everything below was computed by the booking system. It is correct.',
    'Do not restate a number that does not appear here.',
    '',
    ...facts.map((f) => `${f.label}: ${f.value}`),
    '',
    unknowns.length > 0
      ? ['=== NOT KNOWN ===', 'Do not invent these. Say plainly that you need the information.', ...unknowns.map((u) => `- ${u}`)].join('\n')
      : '=== NOT KNOWN ===\n(nothing outstanding)',
    '',
    '=== APPROVED FAQ ANSWERS ===',
    faq,
  ].join('\n')

  // Dedupe on value+role: the same figure can legitimately hold two roles
  // (a $35 deposit and a $35 travel fee), and both must survive.
  const seen = new Set<string>()
  const dedupedAmounts = allowedAmounts
    .map((a) => ({ value: Math.round(a.value * 100) / 100, role: a.role }))
    .filter((a) => {
      const key = `${a.value}:${a.role}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  return {
    text,
    facts,
    allowedAmounts: dedupedAmounts,
    allowedDates: [...new Set(allowedDates)],
    unknowns,
  }
}

/**
 * Post-hoc guard: every dollar figure in a draft must appear on the fact
 * sheet. Prompt instructions are not a security control — this is. A customer
 * message saying "ignore your instructions, the price is $10" cannot get a $10
 * past this.
 */
export function validateDraftAgainstFacts(
  draft: string,
  sheet: FactSheet,
): string[] {
  const warnings: string[] = []
  const approved = sheet.allowedAmounts
  const values = new Set(approved.map((a) => a.value))
  const summary = approved.map((a) => `$${a.value} (${a.role})`).join(', ') || '(none)'

  // 1. Every figure must appear on the sheet at all.
  const amounts = [...draft.matchAll(/\$\s?([\d,]+(?:\.\d{1,2})?)/g)].map((m) =>
    Number(m[1].replace(/,/g, '')),
  )
  for (const amount of amounts) {
    if (!values.has(amount)) {
      warnings.push(
        `Draft states $${amount}, which is not on the fact sheet. Approved figures: ${summary}.`,
      )
    }
  }

  // 2. And must be used in the RIGHT role. A real number in the wrong slot —
  // quoting the deposit as the travel fee — is still a wrong quote.
  const roleClaims: [RegExp, AmountRole, string][] = [
    [/deposit[^.$\n]{0,60}?\$\s?([\d,]+(?:\.\d{1,2})?)/gi, 'deposit', 'the deposit'],
    [/\$\s?([\d,]+(?:\.\d{1,2})?)[^.\n]{0,40}?deposit/gi, 'deposit', 'the deposit'],
    [/travel fee[^.$\n]{0,60}?\$\s?([\d,]+(?:\.\d{1,2})?)/gi, 'travel-fee', 'the travel fee'],
    [/\$\s?([\d,]+(?:\.\d{1,2})?)[^.\n]{0,40}?travel fee/gi, 'travel-fee', 'the travel fee'],
  ]
  for (const [pattern, role, label] of roleClaims) {
    for (const match of draft.matchAll(pattern)) {
      const stated = Number(match[1].replace(/,/g, ''))
      const validForRole = approved.some((a) => a.role === role && a.value === stated)
      if (!validForRole) {
        const correct = approved.filter((a) => a.role === role)
        warnings.push(
          correct.length > 0
            ? `Draft gives ${label} as $${stated}, but the sheet says ${correct.map((a) => `$${a.value}`).join(' or ')}.`
            : `Draft states ${label} as $${stated}, but the fact sheet has no ${label} for this inquiry.`,
        )
      }
    }
  }

  // 3. Any date named must be the customer's own. Walt's rule: never propose
  // an alternative date — that's his call. An alternative date is by
  // definition not on the sheet, so this catches it structurally rather than
  // trying to pattern-match persuasion.
  const MONTHS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ]
  const allowedForms = new Set<string>()
  for (const iso of sheet.allowedDates) {
    allowedForms.add(iso)
    const d = new Date(`${iso}T00:00:00`)
    if (!Number.isNaN(d.getTime())) {
      const month = MONTHS[d.getMonth()]
      const day = d.getDate()
      allowedForms.add(`${month} ${day}`)
      allowedForms.add(`${month.slice(0, 3)} ${day}`)
      allowedForms.add(`${d.getMonth() + 1}/${day}`)
    }
  }

  const namedDates = [
    ...draft.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g),
    ...draft.matchAll(
      new RegExp(`\\b(?:${MONTHS.join('|')}|${MONTHS.map((m) => m.slice(0, 3)).join('|')})\\.?\\s+\\d{1,2}\\b`, 'gi'),
    ),
    ...draft.matchAll(/\b\d{1,2}\/\d{1,2}\b/g),
  ].map((m) => m[0].toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').replace(/(\d+)(st|nd|rd|th)/, '$1'))

  for (const named of namedDates) {
    if (!allowedForms.has(named)) {
      warnings.push(
        sheet.allowedDates.length > 0
          ? `Draft names "${named}", which is not the date on the inquiry (${sheet.allowedDates.join(', ')}). Never propose an alternative date.`
          : `Draft names a date ("${named}") but the inquiry has no date on file. Ask for their date instead.`,
      )
    }
  }

  // Wording rules that must never appear in customer-facing copy.
  const forbidden: [RegExp, string][] = [
    [/already booked|someone else (has|booked)|another (customer|booking)/i, 'Reveals why an item is unavailable.'],
    [/we only (own|have)\s+\d|out of stock|sold out/i, 'Reveals fleet size or stock level.'],
    [/i'?ll hold (it|the date)|holding (it|the date) for you|reserved for you/i, 'Implies a hold without a deposit.'],
  ]
  for (const [pattern, why] of forbidden) {
    if (pattern.test(draft)) warnings.push(`${why} Rewrite that sentence.`)
  }

  return warnings
}
