import { supabaseAdmin } from './_lib/supabaseAdmin.js'
import { sendDraftedReply } from './_lib/emails.js'

interface ApiRequest {
  method?: string
  body: unknown
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

/**
 * Sends a reply Walt has read and approved. Owner-only, same guard as
 * admin-refund.ts and draft-reply.ts.
 *
 * Nothing auto-sends anywhere in Phase 10: this endpoint only ever runs
 * because Walt pressed Send on text he had the chance to edit. The body that
 * arrives here is whatever is in the textarea — his edits, not the model's
 * original — which is the whole point of draft-first.
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

  const { bookingId, to, subject, body, messageId } = (req.body ?? {}) as {
    bookingId?: string
    to?: string
    subject?: string
    body?: string
    messageId?: string
  }

  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return res.status(400).json({ error: 'A valid customer email is required.' })
  }
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'The reply is empty.' })
  }

  try {
    await sendDraftedReply(to, subject?.trim() || 'About your Sippi Lights inquiry', body)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed.'
    return res.status(502).json({ error: `Could not send: ${message}` })
  }

  // Log what actually went out, so the thread in the dashboard reflects the
  // sent text rather than the draft it started as.
  const sentAt = new Date().toISOString()
  if (messageId) {
    await supabaseAdmin
      .from('inquiry_messages')
      .update({ approved_at: sentAt, sent_at: sentAt, draft: body })
      .eq('id', messageId)
      .then(undefined, () => {})
  } else {
    await supabaseAdmin
      .from('inquiry_messages')
      .insert({
        booking_id: bookingId ?? null,
        channel: 'email',
        direction: 'outbound',
        body,
        approved_at: sentAt,
        sent_at: sentAt,
      })
      .then(undefined, () => {})
  }

  return res.status(200).json({ ok: true, sentAt })
}
