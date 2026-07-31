# Sippi Lights — SMS Phase Plan (Phase 9)

Status: **planned, not built.** Walt locked this in as a future phase. This
doc is the spec to approve before any code is written.

Why it matters: Walt's own words — "Not everyone, myself included, operates
via email. Text is superior." For event rentals that's true of customers too;
a delivery-window text gets read in minutes, an email may not get read at all.

## 1. The blocker to start early: carrier registration

US carriers require every business that sends automated texts to register
under **A2P 10DLC** (Application-to-Person, 10-digit long code). This is not
optional and not instant — it is the long pole of this phase, so it should be
started before the code is written.

**Registration path:** Sippi Lights operates under LuxAurum Ventures LLC, so
this registers as a **Standard Brand** using the EIN — not the Sole Proprietor
path (that one is for individuals with no Tax ID, and it's capped at low
throughput).

**Approximate costs (verify at signup — carriers change these):**

| Item | Cost |
|---|---|
| Brand registration | ~$4 one-time |
| Campaign vetting | ~$15 one-time |
| Campaign monthly fee | ~$2–10/month depending on campaign type |
| Phone number | ~$1.15/month |
| Per message | ~$0.008 outbound + carrier fees (~$0.003) |

**Realistic monthly run rate at Sippi Lights' volume:** well under $20/month.
The registration wait (typically days, occasionally longer if the brand info
doesn't match IRS records exactly) is the real cost, not the money.

**Critical detail:** the business name, EIN, and address submitted must match
the IRS EIN registration *exactly* — mismatches are the #1 cause of rejection
and re-submission delays.

## 2. Provider

**Recommendation: Twilio.** Reasons: it's the default for a Vercel serverless
setup, handles 10DLC registration in-dashboard, and the API is a single POST
— no SDK bloat needed. Alternatives (MessageBird, Telnyx, Bandwidth) are
comparable; there's no reason to shop given the volume here.

New dependency: `twilio` (or plain fetch against their REST API — likely the
better call, keeping the serverless bundle small, same pattern as Resend).

## 3. Which messages go SMS, and which stay email

Not everything should be a text. Texts are for **time-sensitive, action-now**
messages; email is for **records**.

| Message | Channel | Why |
|---|---|---|
| Booking confirmation | Email + SMS | Email carries the agreement PDF (a record); SMS confirms instantly |
| 3-day reminder + checklist | **SMS primary**, email backup | This is the one people must actually read |
| Balance due reminder (see payment-terms decision) | **SMS primary** | Money, time-bound — needs to land |
| Delivery window / "on our way" | **SMS only** | Pure logistics, worthless as email |
| Weather call on an outdoor setup | **SMS only** | Same-day, urgent |
| Post-event thank-you + feedback link | Email primary, SMS optional | Not urgent; the email carries the review ask well |
| Inquiry nudge (14-day) | Email + SMS | A text here likely doubles response rate |
| Owner alerts (new booking, new inquiry) | **SMS to Walt** | Walt runs the business from his phone |

That last row is worth calling out: **Walt getting a text the moment a booking
lands** is arguably the highest-value message in the whole system.

## 4. Compliance — non-negotiable, and it shapes the UI

Carrier rules and the TCPA are strict, and violations carry real penalties.

1. **Explicit opt-in at the point of collection.** The checkout and contact
   forms need a checkbox (unchecked by default) with language along the lines
   of: *"Text me about my booking. Message and data rates may apply. Reply
   STOP to opt out."* Transactional booking texts to a customer who gave their
   number for that booking are the lowest-risk category — but the checkbox and
   disclosure still belong there.
2. **STOP / HELP handling.** Twilio auto-handles STOP, but the database must
   record the opt-out so the app never re-queues a message to that number.
   Requires an inbound webhook.
3. **No marketing texts** on this registration. Promotional blasts are a
   different campaign type with stricter vetting. Every message in the table
   above is transactional — keep it that way.
4. **Quiet hours.** No automated sends before 8am or after 9pm local.

## 5. What gets built

**Schema:**
- `bookings.sms_opt_in` (bool, default false)
- `bookings.sms_consent_at` (timestamptz) — proof of consent, with the
  timestamp, is what protects the business in a dispute
- `sms_opt_outs` table keyed by phone number (survives across bookings)
- Per-message sent-at columns, mirroring the email pattern, so a cron rerun
  can never double-send

**Code:**
- `api/_lib/sms.ts` — send helper, mirroring `_lib/emails.ts`
- `api/sms-webhook.ts` — inbound STOP/HELP + replies
- Opt-in checkbox in checkout Step 4 and the contact form
- Extend `api/daily-emails.ts` (rename → `daily-messages.ts`) to send both
  channels off the same schedule
- Owner-alert texts on new booking / new inquiry
- Admin: show opt-in status on the booking drawer; a "text this customer"
  quick action is a natural follow-on

**Docs:** extend `docs/analytics.md` sibling with an `sms.md` covering what
sends when, and how to handle a customer who says they never opted in.

## 6. Sequence

1. **Walt:** start 10DLC registration (EIN details must match IRS exactly) —
   do this first, it gates everything.
2. While it's pending: build schema, opt-in UI, and send helpers behind a flag.
3. On approval: wire the live number, verify each message type end to end.
4. Cut over one message class at a time — reminders first (highest value,
   lowest risk), owner alerts second, the rest after.

## 7. Open decisions for Walt

- Does the business texting number need to be **(601) 813-2464** (the number
  customers already know), or a new dedicated number? Porting the existing
  number into Twilio is possible but means Twilio then controls that number —
  which also makes it *more* transferable in a sale, not less. This ties
  directly to the "portable business phone number" item on the transfer
  checklist.
- Should the post-event feedback ask go by text as well as email? Higher
  response rate, slightly more intrusive.
