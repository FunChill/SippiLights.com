import { supabaseAdmin } from './_lib/supabaseAdmin.js'
import { MARQUEE_PRICE, calculateDeposit, calculateTravelFee } from '../src/config/pricing.js'
import { estimateDistanceMiles } from '../src/data/zipDistances.js'
import { sendInquirySavedEmail, sendOwnerInquiryNotification } from './_lib/emails.js'

interface ApiRequest {
  method?: string
  body: unknown
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

interface InquiryBody {
  eventDate?: string
  items?: Array<{ character: string; finish: string; qty: number }>
  wordBuilt?: string
  ledColor?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  eventType?: string
  indoorOutdoor?: string
  venueAddress?: string
  zip?: string
  notes?: string | null
}

/**
 * "I'm interested but my date isn't locked yet." Saves the fully-built order
 * as an inquiry with no payment and no inventory hold, so the lead stays warm
 * and gets one nudge 14 days later. Deliberately does NOT re-check
 * availability: nothing is being reserved, and a date this customer hasn't
 * committed to shouldn't be gated on today's inventory.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    eventDate,
    items,
    wordBuilt,
    ledColor,
    customerName,
    customerPhone,
    customerEmail,
    eventType,
    indoorOutdoor,
    venueAddress,
    zip,
    notes,
  } = (req.body ?? {}) as InquiryBody

  if (!customerName || !customerPhone || !customerEmail) {
    return res.status(400).json({ error: 'Name, phone, and email are required.' })
  }
  if (!eventDate) {
    return res.status(400).json({ error: 'A target date is required, even a tentative one.' })
  }

  const requestedItems = (items ?? []).map((i) => ({
    character: String(i.character).toUpperCase(),
    finish: i.finish,
    qty: Number(i.qty) || 0,
  }))

  const marqueeCount = requestedItems.reduce((sum, i) => sum + i.qty, 0)
  const marqueeSubtotal = marqueeCount * MARQUEE_PRICE
  const travelFee = calculateTravelFee(zip ? estimateDistanceMiles(zip) : null)
  const estimatedTotal = marqueeSubtotal + travelFee
  const estimatedDeposit = calculateDeposit(marqueeCount, marqueeSubtotal)

  const { data: booking, error: insertError } = await supabaseAdmin
    .from('bookings')
    .insert({
      event_date: eventDate,
      status: 'inquiry',
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      event_type: eventType ?? null,
      indoor_outdoor: indoorOutdoor ?? null,
      venue_address: venueAddress?.trim() || null,
      items: requestedItems.map((i) => ({
        itemId: `${i.finish}-${i.character}`,
        character: i.character,
        finish: i.finish,
        qty: i.qty,
        price: MARQUEE_PRICE,
      })),
      word_built: wordBuilt ? wordBuilt.toUpperCase() : null,
      led_color: wordBuilt ? ledColor : null,
      subtotal: estimatedTotal,
      deposit_due: estimatedDeposit,
      notes: [notes, 'Saved from checkout — date not confirmed by customer.']
        .filter(Boolean)
        .join(' | '),
    })
    .select()
    .single()

  if (insertError || !booking) {
    return res.status(500).json({ error: 'Could not save your request. Please try again.' })
  }

  // Emails are best-effort: the lead is already captured.
  await Promise.allSettled([
    sendInquirySavedEmail({
      customerName,
      customerEmail,
      eventDate,
      wordBuilt: wordBuilt ? wordBuilt.toUpperCase() : null,
      subtotal: estimatedTotal,
      depositDue: estimatedDeposit,
      venueAddress: venueAddress ?? null,
    }),
    sendOwnerInquiryNotification(
      [
        'SAVED FROM CHECKOUT (date not confirmed)',
        `Name: ${customerName}`,
        `Email: ${customerEmail}`,
        `Phone: ${customerPhone}`,
        `Target date: ${eventDate}`,
        wordBuilt ? `Marquee: "${wordBuilt.toUpperCase()}"` : null,
        `Estimated total: $${estimatedTotal}`,
        venueAddress ? `Venue: ${venueAddress}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  ])

  return res.status(200).json({ ok: true })
}
