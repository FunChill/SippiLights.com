import { supabaseAdmin } from './_lib/supabaseAdmin.js'

interface ApiRequest {
  method?: string
  body: unknown
  query?: Record<string, string | string[] | undefined>
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

interface FeedbackBody {
  token?: string
  rating?: number
  feedbackText?: string
  permissionToShare?: boolean
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Feedback capture for /feedback/[token]. The token is the booking's random
 * feedback_token uuid (never the raw booking id), emailed in the post-event
 * thank-you. Reviews are owner-only at the RLS level, so both the lookup and
 * the insert go through the service role here — the client can only submit,
 * never read.
 *
 * GET  ?token=…  → { valid, alreadySubmitted, firstName, wordBuilt, eventDate }
 * POST {token, rating, feedbackText, permissionToShare} → { ok }
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'GET') {
    const token = typeof req.query?.token === 'string' ? req.query.token : ''
    if (!UUID_RE.test(token)) {
      return res.status(404).json({ valid: false })
    }

    const booking = await findBooking(token)
    if (!booking) return res.status(404).json({ valid: false })

    const alreadySubmitted = await hasReview(booking.id)
    return res.status(200).json({
      valid: true,
      alreadySubmitted,
      firstName: String(booking.customer_name).trim().split(/\s+/)[0] ?? '',
      wordBuilt: booking.word_built,
      eventDate: booking.event_date,
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token, rating, feedbackText, permissionToShare } = (req.body ?? {}) as FeedbackBody

  if (!token || !UUID_RE.test(token)) {
    return res.status(404).json({ error: 'This feedback link is not valid.' })
  }
  const ratingNum = Number(rating)
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Please choose a star rating.' })
  }
  if (!feedbackText || !String(feedbackText).trim()) {
    return res.status(400).json({ error: 'Please add a few words of feedback.' })
  }

  const booking = await findBooking(token)
  if (!booking) {
    return res.status(404).json({ error: 'This feedback link is not valid.' })
  }

  // unique(booking_id) also enforces this at the database level — the early
  // check just gives a friendlier message than a constraint violation.
  if (await hasReview(booking.id)) {
    return res.status(409).json({ error: 'Feedback for this booking was already submitted — thank you!' })
  }

  const { error: insertError } = await supabaseAdmin.from('reviews').insert({
    booking_id: booking.id,
    rating: ratingNum,
    feedback_text: String(feedbackText).trim().slice(0, 4000),
    permission_to_share: permissionToShare === true,
  })

  if (insertError) {
    const conflict = insertError.code === '23505'
    return res.status(conflict ? 409 : 500).json({
      error: conflict
        ? 'Feedback for this booking was already submitted — thank you!'
        : 'Could not save your feedback. Please try again.',
    })
  }

  return res.status(200).json({ ok: true })
}

async function findBooking(token: string) {
  const { data } = await supabaseAdmin
    .from('bookings')
    .select('id, customer_name, word_built, event_date, status')
    .eq('feedback_token', token)
    .in('status', ['confirmed', 'completed'])
    .maybeSingle()
  return data
}

async function hasReview(bookingId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle()
  return !!data
}
