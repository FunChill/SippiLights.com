import Stripe from 'stripe'
import { supabaseAdmin } from './_lib/supabaseAdmin.js'

interface ApiRequest {
  method?: string
  body: unknown
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'not-configured')

/**
 * Owner-only refunds, issued from the admin dashboard instead of the Stripe
 * console. Auth = the caller's Supabase session token; public sign-ups are
 * disabled, so authenticated means the owner.
 *
 * Supports a full or partial refund. Refunding does NOT automatically cancel
 * the booking — a partial refund (goodwill, a discount after the fact) often
 * accompanies a booking that still goes ahead. Cancelling stays a separate,
 * deliberate action.
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

  const { bookingId, amount } = (req.body ?? {}) as { bookingId?: string; amount?: number }
  if (!bookingId) return res.status(400).json({ error: 'Missing bookingId.' })

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, amount_paid, deposit_paid, stripe_payment_intent_id, refunded_at, refund_amount')
    .eq('id', bookingId)
    .single()

  if (error || !booking) return res.status(404).json({ error: 'Booking not found.' })

  if (!booking.stripe_payment_intent_id) {
    return res.status(400).json({
      error:
        'No Stripe payment is on file for this booking — it was either never paid online, or paid before refunds were tracked. Refund it in the Stripe dashboard.',
    })
  }

  const alreadyRefunded = Number(booking.refund_amount ?? 0)
  const paid = Number(booking.amount_paid ?? 0)
  const refundable = Math.max(0, paid - alreadyRefunded)

  if (refundable <= 0) {
    return res.status(400).json({ error: 'This payment has already been fully refunded.' })
  }

  // No amount = refund everything still refundable.
  const requested = amount == null ? refundable : Number(amount)
  if (!Number.isFinite(requested) || requested <= 0) {
    return res.status(400).json({ error: 'Enter a refund amount greater than zero.' })
  }
  if (requested > refundable) {
    return res.status(400).json({
      error: `The most that can be refunded is $${refundable.toFixed(2)}.`,
    })
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      amount: Math.round(requested * 100),
    })

    const totalRefunded = alreadyRefunded + requested
    await supabaseAdmin
      .from('bookings')
      .update({
        refunded_at: new Date().toISOString(),
        refund_amount: totalRefunded,
        // Only clear the paid flag once the customer has their money back in full.
        ...(totalRefunded >= paid ? { deposit_paid: false, paid_in_full: false } : {}),
      })
      .eq('id', bookingId)

    return res.status(200).json({
      ok: true,
      refunded: requested,
      totalRefunded,
      remaining: refundable - requested,
      stripeRefundId: refund.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refund failed.'
    return res.status(500).json({ error: `Stripe refused the refund: ${message}` })
  }
}
