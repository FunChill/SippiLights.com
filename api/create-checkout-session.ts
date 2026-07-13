import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { MARQUEE_PRICE, calculateDeposit } from '../src/config/pricing.js'

// Loosely typed instead of depending on @vercel/node — this file isn't part
// of the Vite/tsc build (only src/ is), and Vercel's Node runtime supplies
// req.body (pre-parsed JSON) and res.status/json at runtime regardless.
interface ApiRequest {
  method?: string
  body: unknown
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
)

// Fallback prevents Stripe SDK from throwing at module load when the env var
// isn't set — the actual API call will return a 401 instead of crashing the
// Vercel function runtime at import time.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'not-configured')

interface RequestedItemInput {
  character: string
  finish: string
  qty: number
}

interface CheckoutBody {
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
  agreementName?: string
  agreementVersion?: string
}

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
    agreementName,
    agreementVersion,
  } = (req.body ?? {}) as CheckoutBody

  if (
    !eventDate ||
    !customerName ||
    !customerPhone ||
    !customerEmail ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ error: 'Missing required booking fields.' })
  }

  if (!agreementName || !agreementVersion) {
    return res.status(400).json({ error: 'Rental agreement must be accepted before payment.' })
  }

  const requestedItems: RequestedItemInput[] = items.map((i) => ({
    character: String(i.character).toUpperCase(),
    finish: i.finish,
    qty: Number(i.qty) || 0,
  }))

  // Re-check the date isn't blocked — never trust the client's last check.
  const { data: block, error: blockError } = await supabaseAdmin
    .from('availability_blocks')
    .select('reason')
    .eq('date', eventDate)
    .maybeSingle()

  if (blockError) {
    return res.status(500).json({ error: 'Could not verify date availability.' })
  }
  if (block) {
    return res
      .status(409)
      .json({ error: `This date is unavailable: ${block.reason ?? 'blocked'}.` })
  }

  // Re-fetch owned + booked quantities server-side.
  const { data: inventoryRows, error: inventoryError } = await supabaseAdmin
    .from('inventory_items')
    .select('char_value, finish, qty_owned')
    .not('char_value', 'is', null)

  if (inventoryError) {
    return res.status(500).json({ error: 'Could not load inventory.' })
  }

  const ownedMap = new Map<string, number>()
  for (const row of inventoryRows ?? []) {
    if (!row.char_value) continue
    ownedMap.set(`${row.char_value.toUpperCase()}-${row.finish}`, row.qty_owned)
  }

  const { data: bookedRows, error: bookedError } = await supabaseAdmin.rpc(
    'get_booked_quantities',
    { check_date: eventDate },
  )

  if (bookedError) {
    return res.status(500).json({ error: 'Could not verify availability.' })
  }

  const bookedMap = new Map<string, number>()
  for (const row of bookedRows ?? []) {
    bookedMap.set(`${row.char_value}-${row.finish}`, row.qty)
  }

  for (const item of requestedItems) {
    const key = `${item.character}-${item.finish}`
    const owned = ownedMap.get(key) ?? 0
    const booked = bookedMap.get(key) ?? 0
    if (owned - booked < item.qty) {
      // Demand signal: a customer got all the way to checkout and lost the
      // item — the strongest possible "buy more of these" evidence.
      await supabaseAdmin.from('demand_signals').upsert(
        {
          date: eventDate,
          char_value: item.character,
          finish: item.finish,
          requested_qty: item.qty,
          available_qty: Math.max(0, owned - booked),
        },
        { onConflict: 'date,char_value,finish,logged_on', ignoreDuplicates: true },
      )
      return res.status(409).json({
        error: `"${item.character}" is no longer available for that date. Please go back and check availability again.`,
      })
    }
  }

  // Server-computed pricing — never trust client-sent totals for money.
  const marqueeCount = requestedItems.reduce((sum, i) => sum + i.qty, 0)
  const marqueeSubtotal = marqueeCount * MARQUEE_PRICE
  const depositDue = calculateDeposit(marqueeCount, marqueeSubtotal)

  if (depositDue <= 0) {
    return res.status(400).json({ error: 'Nothing to charge a deposit for.' })
  }

  const bookingItems = requestedItems.map((i) => ({
    itemId: `${i.finish}-${i.character}`,
    character: i.character,
    finish: i.finish,
    qty: i.qty,
    price: MARQUEE_PRICE,
  }))

  const { data: booking, error: insertError } = await supabaseAdmin
    .from('bookings')
    .insert({
      event_date: eventDate,
      status: 'pending_deposit',
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      event_type: eventType ?? null,
      indoor_outdoor: indoorOutdoor ?? null,
      venue_address: venueAddress ? `${venueAddress}, ${zip ?? ''}`.trim() : null,
      items: bookingItems,
      word_built: wordBuilt || null,
      led_color: wordBuilt ? ledColor : null,
      subtotal: marqueeSubtotal,
      deposit_due: depositDue,
      notes: notes ?? null,
      agreement_accepted_at: new Date().toISOString(),
      agreement_name: agreementName,
      agreement_version: agreementVersion,
    })
    .select()
    .single()

  if (insertError || !booking) {
    return res.status(500).json({ error: insertError?.message ?? 'Failed to create booking.' })
  }

  const origin =
    (req.headers.origin as string) ||
    (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:5173')

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: wordBuilt
                ? `Sippi Lights deposit — "${wordBuilt}"`
                : 'Sippi Lights deposit',
            },
            unit_amount: Math.round(depositDue * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { booking_id: booking.id },
      success_url: `${origin}/book/confirmed?booking_id=${booking.id}`,
      cancel_url: `${origin}/book?cancelled=1`,
    })

    return res.status(200).json({ url: session.url })
  } catch {
    // Stripe session creation failed after the booking was already inserted
    // as pending_deposit — release it rather than leaving a phantom hold on
    // inventory with no way to ever pay for it.
    await supabaseAdmin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    return res.status(500).json({ error: 'Could not start payment. Please try again.' })
  }
}
