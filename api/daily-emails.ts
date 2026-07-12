import { supabaseAdmin } from './_lib/supabaseAdmin'
import { sendReminderEmail, sendThankYouEmail } from './_lib/emails'

interface ApiRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

function isoDateWithOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Daily Vercel Cron: 3-days-before reminder and 1-day-after thank-you for
 * confirmed bookings. Sent-at columns make each email once-only even if the
 * cron reruns or a day is missed (date filters use <=/>= so a skipped day
 * still catches up on the next run).
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  let remindersSent = 0
  let thankYousSent = 0
  const errors: string[] = []

  // Reminders: event within 3 days from today (but not past), not yet reminded.
  const { data: upcoming, error: upcomingError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .is('reminder_email_sent_at', null)
    .gte('event_date', isoDateWithOffset(0))
    .lte('event_date', isoDateWithOffset(3))

  if (upcomingError) errors.push(`reminder query: ${upcomingError.message}`)

  for (const booking of upcoming ?? []) {
    try {
      await sendReminderEmail({
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        eventDate: booking.event_date,
        wordBuilt: booking.word_built,
        subtotal: booking.subtotal,
        depositDue: booking.deposit_due,
        venueAddress: booking.venue_address,
      })
      await supabaseAdmin
        .from('bookings')
        .update({ reminder_email_sent_at: new Date().toISOString() })
        .eq('id', booking.id)
      remindersSent++
    } catch (err) {
      errors.push(`reminder ${booking.id}: ${err instanceof Error ? err.message : 'failed'}`)
    }
  }

  // Thank-yous: event was yesterday or earlier (within a 7-day catch-up
  // window), confirmed or completed, not yet thanked.
  const { data: finished, error: finishedError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .in('status', ['confirmed', 'completed'])
    .is('thankyou_email_sent_at', null)
    .gte('event_date', isoDateWithOffset(-7))
    .lte('event_date', isoDateWithOffset(-1))

  if (finishedError) errors.push(`thank-you query: ${finishedError.message}`)

  for (const booking of finished ?? []) {
    try {
      await sendThankYouEmail({
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        eventDate: booking.event_date,
        wordBuilt: booking.word_built,
        subtotal: booking.subtotal,
        depositDue: booking.deposit_due,
        venueAddress: booking.venue_address,
      })
      await supabaseAdmin
        .from('bookings')
        .update({ thankyou_email_sent_at: new Date().toISOString() })
        .eq('id', booking.id)
      thankYousSent++
    } catch (err) {
      errors.push(`thank-you ${booking.id}: ${err instanceof Error ? err.message : 'failed'}`)
    }
  }

  return res.status(200).json({ remindersSent, thankYousSent, errors })
}
