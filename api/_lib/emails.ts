import { Resend } from 'resend'

// Fallback prevents Resend SDK from throwing at module load when the env var
// isn't set yet — the actual send() call will return a 401 instead of crashing
// the entire Vercel function at import time.
const resend = new Resend(process.env.RESEND_API_KEY || 'not-configured')

// Until the sippilights.com domain is verified in Resend, the free tier only
// delivers from onboarding@resend.dev (and only to the account owner's own
// address) — set EMAIL_FROM once the domain is verified.
const FROM = process.env.EMAIL_FROM || 'Sippi Lights <onboarding@resend.dev>'
const OWNER = process.env.OWNER_EMAIL || 'info@sippilights.com'
const REVIEW_URL = process.env.GOOGLE_REVIEW_URL || ''
const PHONE = '(601) 813-2464'

interface BookingEmailData {
  customerName: string
  customerEmail: string
  eventDate: string
  wordBuilt: string | null
  subtotal: number | null
  depositDue: number | null
  venueAddress: string | null
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

function layout(body: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1C1B19;line-height:1.6">
  <h2 style="color:#8a6d2f;margin-bottom:2px">Sippi Lights</h2>
  <p style="color:#888;font-size:12px;margin-top:0">Elevated Event Illumination · Jackson, MS</p>
  ${body}
  <p style="margin-top:28px;color:#555">— Sippi Lights · ${PHONE}</p>
</div>`
}

function orderSummary(d: BookingEmailData): string {
  const rows = [
    d.wordBuilt ? `<li>Marquee display: <strong>"${d.wordBuilt}"</strong></li>` : '',
    `<li>Event date: <strong>${d.eventDate}</strong></li>`,
    d.venueAddress ? `<li>Venue: ${d.venueAddress}</li>` : '',
    d.subtotal != null ? `<li>Order total: $${d.subtotal}</li>` : '',
    d.depositDue != null && d.subtotal != null
      ? `<li>Deposit paid: $${d.depositDue} · Balance due at delivery: $${d.subtotal - d.depositDue}</li>`
      : '',
  ].filter(Boolean)
  return `<ul style="padding-left:18px">${rows.join('')}</ul>`
}

export async function sendConfirmationEmail(
  d: BookingEmailData,
  agreementPdf: Buffer | null,
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: d.customerEmail,
    subject: `You're booked! ${d.wordBuilt ? `"${d.wordBuilt}" is` : "Your marquee is"} locked in for ${d.eventDate}`,
    html: layout(`
      <p>Hey ${firstName(d.customerName)},</p>
      <p>Your date is officially locked in — we're excited to light this one up for you!</p>
      ${orderSummary(d)}
      <p>We'll deliver and set everything up before your event and pick it all up after. You don't lift a thing. We'll reach out before your date to confirm delivery timing.</p>
      <p>Your rental agreement is attached for your records. The remaining balance is due at delivery.</p>
      <p>Questions before then? Call or text anytime.</p>
    `),
    attachments: agreementPdf
      ? [{ filename: 'SippiLights-Rental-Agreement.pdf', content: agreementPdf }]
      : undefined,
  })
}

export async function sendReminderEmail(d: BookingEmailData): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: d.customerEmail,
    subject: `${d.eventDate} is almost here — quick checklist from Sippi Lights`,
    html: layout(`
      <p>Hey ${firstName(d.customerName)},</p>
      <p>Your big day is three days out! Here's the quick checklist so setup goes smooth:</p>
      <ul style="padding-left:18px">
        <li>A standard power outlet within 25 feet of the setup spot</li>
        <li>Someone 18+ on site to confirm placement at delivery</li>
        <li>If outdoors: we're watching the weather — under 20% rain and under 10 mph wind is a go</li>
      </ul>
      ${orderSummary(d)}
      <p>Balance is due at delivery. See you soon — this is going to look amazing.</p>
    `),
  })
}

export async function sendThankYouEmail(d: BookingEmailData): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: d.customerEmail,
    subject: 'Hope it was unforgettable ✨',
    html: layout(`
      <p>Hey ${firstName(d.customerName)},</p>
      <p>Hope your celebration was everything you wanted it to be — we loved being part of it.</p>
      ${REVIEW_URL ? `<p>If the lights made your moment, a quick review means the world to a local business like ours: <a href="${REVIEW_URL}" style="color:#8a6d2f">leave a review</a>.</p>` : ''}
      <p>Next birthday, wedding, or graduation on the calendar? <a href="https://sippilights.com/book" style="color:#8a6d2f">Your next date is one click away</a> — the good ones go fast.</p>
    `),
  })
}

export async function sendInquiryAutoReply(customerName: string, customerEmail: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: 'Got your request — Sippi Lights',
    html: layout(`
      <p>Hey ${firstName(customerName)},</p>
      <p>We got your request and we're on it — you'll hear back from us within 24 hours.</p>
      <p>In the meantime, you can play with the <a href="https://sippilights.com/builder" style="color:#8a6d2f">word builder</a> to preview your marquee, or call/text if it's time-sensitive.</p>
    `),
  })
}

export async function sendOwnerInquiryNotification(summary: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: OWNER,
    subject: 'New Sippi Lights inquiry',
    html: layout(`<p>New inquiry just landed:</p><pre style="background:#f5f5f2;padding:12px;border-radius:8px;font-size:12px">${summary}</pre><p><a href="https://sippilights.com/admin" style="color:#8a6d2f">Open the dashboard</a></p>`),
  })
}
