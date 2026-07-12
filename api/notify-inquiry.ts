import { sendInquiryAutoReply, sendOwnerInquiryNotification } from './_lib/emails'

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
  customerName?: string
  customerEmail?: string
  eventDate?: string
  eventType?: string
  services?: string[]
  message?: string
}

/**
 * Fired by the Contact form right after its Supabase insert succeeds:
 * auto-reply to the customer + notification to the owner. Send-only — no
 * database writes, so there's nothing here for a malicious caller to
 * corrupt; worst case is sending an email to an address they control.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { customerName, customerEmail, eventDate, eventType, services, message } =
    (req.body ?? {}) as InquiryBody

  if (!customerName || !customerEmail) {
    return res.status(400).json({ error: 'Missing name or email.' })
  }

  const results = await Promise.allSettled([
    sendInquiryAutoReply(customerName, customerEmail),
    sendOwnerInquiryNotification(
      [
        `Name: ${customerName}`,
        `Email: ${customerEmail}`,
        eventDate ? `Event date: ${eventDate}` : null,
        eventType ? `Event type: ${eventType}` : null,
        services?.length ? `Services: ${services.join(', ')}` : null,
        message ? `Message: ${message}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  ])

  const failed = results.filter((r) => r.status === 'rejected').length
  return res.status(200).json({ sent: results.length - failed, failed })
}
