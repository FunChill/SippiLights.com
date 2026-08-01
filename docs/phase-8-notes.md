# Sippi Lights — Phase 8: Checkout UX, Travel Fee, Flexible Payments, Refunds

> **Written after the fact.** Phases 1–7 were specified before they were built.
> Phase 8 was not — it went straight from Walt's punch list to code. This
> document reconstructs what shipped and why, from the two merge commits and
> the code itself. It is a **record, not a plan**: nothing here was approved in
> advance in this form, and every decision below is already live in production.
>
> Source commits: `fc9e6db` → merged as `87fbcad` (8a), `4d6a30a` → merged as
> `ae86d45` (8b), plus `42d6f89` (ZIP ring data).

---

## 8a — Checkout UX fixes + travel fee + save-for-later

Origin: Walt's punch list from the first live walkthrough of the booking flow.

### Number finish no longer implies black letters

The availability check was already correct — letters force white. The **UI was
the liar**. The white/black toggle is now disabled and struck through until the
word actually contains a digit, and the review screen only prints that row when
numbers are present.

### Step navigation scrolls to the tracker

Every step change returns to the step tracker rather than dropping the customer
at the bottom of the next form.

### Venue address split into fields

Street / City / State (defaults to MS) / ZIP, composed into one line. Fixes the
duplicated ZIP that appeared in the summary.

### The word is uppercased at entry

Not at display time — at the point of entry, so Stripe, emails, the agreement
PDF, and admin all show the capitals the physical marquees actually are.

### Travel fee replaces the high out-of-radius minimum

The most consequential pricing change in Phase 8.

| Before | After |
|---|---|
| 4-marquee minimum beyond 25 mi | 2-marquee minimum (`MIN_MARQUEES_OUTSIDE_25`) |
| No travel fee | Flat fee for the 26–50 mi zone (`TRAVEL_FEE_BEYOND_25`) |

Rationale, from the commit: the travel fee now carries the cost of the longer
run, so the order minimum no longer has to. Flat rather than per-mile so the
customer understands it instantly.

Three rules that must not drift:

1. Disclosed at the logistics step **and** on the review summary.
2. **Recomputed server-side from the ZIP** — the browser's figure is never
   trusted.
3. Lands in the **balance due at delivery, never in the deposit**, so the
   $20 / 25% deposit rule stays purely marquee-based.

The fee is **$35 flat**, confirmed by Walt. The constant carried a stale
"PENDING WALT'S FINAL NUMBER" comment for a while after the number was
actually decided — the value was always correct, the comment was not.

`42d6f89` later loaded the 26–50 mile ZIP ring into `src/data/zipDistances.ts`,
without which the fee could never actually fire.

### "Save my setup for later"

A customer who builds a full order but hasn't settled their date is a warm
lead, not a bounce. Saves as `status: 'inquiry'` with the whole order attached:

- **No payment, no inventory hold.** Nothing is reserved.
- Deliberately does **not** re-check availability — nothing is being reserved,
  and a date the customer hasn't committed to shouldn't be gated on today's
  inventory.
- Confirms by email, lands in the admin inbox.
- Gets **exactly one** nudge 14 days later via the existing daily cron.
  `bookings.inquiry_nudge_sent_at` is set once, so a cron rerun or a missed day
  can never double-send.

Code: `api/save-inquiry.ts`, migration `20250601121100_inquiry_nudge_tracking.sql`.

---

## 8b — Flexible payment amounts, admin refunds, spam protection

### The deposit became a floor, not a charge

"Deposit due now" became "How much to pay now", with Minimum / Half / Pay in
full / custom.

`clampPaymentAmount()` in `src/config/pricing.ts` is the single authority and
runs on **both** sides — the server recomputes it, so a tampered client can
neither pay below the minimum nor above the order total. This is the security
property of the feature; the browser copy exists only for display.

Paying in full sets `paid_in_full`, which:

- shows as "PAID IN FULL" on the booking,
- removes the balance-collection step from the delivery flow entirely,
  replacing it with "Mark completed (prepaid)",
- changes the Stripe line item to read "payment in full" rather than "deposit".

New columns (`20250601121200_payments_and_refunds.sql`): `amount_paid`,
`paid_in_full`, `stripe_payment_intent_id`, `refunded_at`, `refund_amount`.
Note `deposit_due` keeps its original meaning — the required minimum for that
order — while `amount_paid` records what was actually charged.

### Refunds from the dashboard

The Stripe webhook now records the payment intent, which is what makes
refunding from our own UI possible at all. Full or partial refunds from the
booking drawer, with a confirmation prompt, running totals, and a guard against
over-refunding.

**Refunding deliberately does not cancel the booking.** A partial refund
(goodwill, a discount after the fact) often accompanies a booking that still
goes ahead. Cancelling stays a separate, deliberate action.

Auth: the caller's Supabase session token. Public sign-ups are disabled, so
authenticated means the owner. `api/admin-refund.ts` is the reference
implementation for any future owner-only endpoint.

### Contact form spam protection

Trigger: a real SEO bot submitted an inquiry with the event year **51201**.

- **Off-screen honeypot** field — positioned off-screen rather than
  `display:none`, which bots detect. Filled submissions are silently dropped
  and shown a *fake success*, so the bot doesn't retry a different way.
- **Event date bounded** to today through three years out, enforced in the
  input and again in the submit handler.

### Also in 8b

The word-builder tagline was removed per Walt — the preview never matches the
real fixtures, and the gallery does that job honestly.

---

## What Phase 8 leaves open

1. Phase 8 was built without a spec. If that is to be the norm going forward,
   the phase-document convention should be retired deliberately rather than
   left to lapse — otherwise the record gets patchier over time, as it did
   here.
