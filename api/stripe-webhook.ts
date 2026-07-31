import Stripe from 'stripe'
import { supabaseAdmin } from './_lib/supabaseAdmin.js'
import { generateAgreementPdf } from './_lib/agreementPdf.js'
import { sendConfirmationEmail } from './_lib/emails.js'

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

async function readRawBody(req: ApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

/** Post-payment fulfillment: agreement PDF to storage + confirmation email. Failures here must never bounce the webhook — payment already succeeded. */
async function fulfillBooking(bookingId: string): Promise<void> {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    console.error('fulfillBooking: could not load booking', bookingId, error?.message)
    return
  }

  let pdfBuffer: Buffer | null = null
  try {
    pdfBuffer = await generateAgreementPdf({
      customerName: booking.agreement_name ?? booking.customer_name,
      eventDate: booking.event_date,
      wordBuilt: booking.word_built,
      subtotal: booking.subtotal,
      depositDue: booking.deposit_due,
      acceptedAt: booking.agreement_accepted_at ?? new Date().toISOString(),
      agreementVersion: booking.agreement_version ?? 'unversioned',
      bookingId: booking.id,
    })

    const pdfPath = `${booking.id}.pdf`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('agreements')
      .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      console.error('fulfillBooking: PDF upload failed', bookingId, uploadError.message)
    } else {
      await supabaseAdmin
        .from('bookings')
        .update({ agreement_pdf_path: pdfPath })
        .eq('id', bookingId)
    }
  } catch (err) {
    console.error('fulfillBooking: PDF generation failed', bookingId, err)
  }

  try {
    await sendConfirmationEmail(
      {
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        eventDate: booking.event_date,
        wordBuilt: booking.word_built,
        subtotal: booking.subtotal,
        depositDue: booking.deposit_due,
        venueAddress: booking.venue_address,
      },
      pdfBuffer,
    )
    await supabaseAdmin
      .from('bookings')
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq('id', bookingId)
  } catch (err) {
    console.error('fulfillBooking: confirmation email failed', bookingId, err)
  }
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
      // Capture the payment intent so refunds can be issued from the admin
      // dashboard without logging into Stripe.
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent?.id ?? null)

      const { data: updated, error } = await supabaseAdmin
        .from('bookings')
        .update({
          deposit_paid: true,
          status: 'confirmed',
          stripe_payment_intent_id: paymentIntentId,
          ...(session.amount_total != null ? { amount_paid: session.amount_total / 100 } : {}),
        })
        .eq('id', bookingId)
        .eq('status', 'pending_deposit') // don't resurrect an already-cancelled/expired booking
        .select('id')

      if (error) {
        // Log and still 200 the webhook — Stripe retries on non-2xx, and a
        // DB hiccup here shouldn't cause Stripe to keep hammering us.
        console.error('Failed to confirm booking from webhook:', bookingId, error.message)
      } else if (updated && updated.length > 0) {
        await fulfillBooking(bookingId)
      }
    }
  }

  return res.status(200).json({ received: true })
}
