import Stripe from 'stripe'
import { supabaseAdmin } from './_lib/supabaseAdmin.js'
import { MARQUEE_PRICE, calculateDeposit } from '../src/config/pricing.js'

interface ApiRequest {
  method?: string
  body: unknown
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

/**
 * Owner-only: converts an inquiry to pending_deposit and returns a Stripe
 * Checkout URL Walt can text/email to the customer. Auth = the caller's
 * Supabase session token; sign-ups are disabled so authenticated == owner.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = (req.headers.authorization as string) ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Not signed in.' })

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid session.' })
  }

  const { bookingId } = (req.body ?? {}) as { bookingId?: string }
  if (!bookingId) return res.status(400).json({ error: 'Missing bookingId.' })

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (error || !booking) return res.status(404).json({ error: 'Booking not found.' })

  // Deposit: use what's on the row, else compute from marquee items.
  let depositDue: number | null = booking.deposit_due
  let subtotal: number | null = booking.subtotal
  if (depositDue == null) {
    const items = Array.isArray(booking.items) ? booking.items : []
    const marqueeCount = items
      .filter((i: { character?: string | null }) => i.character)
      .reduce((sum: number, i: { qty?: number }) => sum + (Number(i.qty) || 1), 0)
    if (marqueeCount > 0) {
      subtotal = subtotal ?? marqueeCount * MARQUEE_PRICE
      depositDue = calculateDeposit(marqueeCount, marqueeCount * MARQUEE_PRICE)
    }
  }

  if (!depositDue || depositDue <= 0) {
    return res.status(400).json({
      error:
        'No deposit amount on this booking and none could be computed — set the subtotal/deposit first.',
    })
  }

  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'pending_deposit', deposit_due: depositDue, subtotal })
    .eq('id', bookingId)

  if (updateError) return res.status(500).json({ error: updateError.message })

  const origin = (req.headers.origin as string) || 'https://sippilights.com'
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: booking.customer_email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: booking.word_built
              ? `Sippi Lights deposit — "${booking.word_built}"`
              : `Sippi Lights deposit — ${booking.event_date}`,
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

  return res.status(200).json({ url: session.url, depositDue })
}
