import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Raw body required for Stripe signature verification — disable the
// platform's default JSON body parsing for this route.
export const config = {
  api: {
    bodyParser: false,
  },
}

interface ApiRequest extends AsyncIterable<Buffer | string> {
  method?: string
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
  send(data: unknown): void
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
)

async function readRawBody(req: ApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signature = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

  let event: Stripe.Event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, signature as string, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return res.status(400).send(`Webhook signature verification failed: ${message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const bookingId = session.metadata?.booking_id

    if (bookingId) {
      const { error } = await supabaseAdmin
        .from('bookings')
        .update({ deposit_paid: true, status: 'confirmed' })
        .eq('id', bookingId)
        .eq('status', 'pending_deposit') // don't resurrect an already-cancelled/expired booking

      if (error) {
        // Log and still 200 the webhook — Stripe retries on non-2xx, and a
        // DB hiccup here shouldn't cause Stripe to keep hammering us. Walt
        // should be alerted separately (Phase 5/6 notification territory).
        console.error('Failed to confirm booking from webhook:', bookingId, error.message)
      }
    }
  }

  return res.status(200).json({ received: true })
}
