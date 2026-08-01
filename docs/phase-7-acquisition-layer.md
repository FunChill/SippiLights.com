# Sippi Lights — Phase 7: Acquisition-Readiness Layer

> The original Phase 7 build prompt, as issued. Preserved verbatim as the
> record of what was specified. **Shipped** — see `src/lib/phase7.ts` and
> migrations `20250601120800_phase7_acquisition_layer.sql` and
> `20250601120900_phase7b_reviews_public.sql`.
>
> Companion decision record: `review-channel-decision.md`.
>
> Branch at the time: `phase7`, branched from approved Phase 6.

---

## Context

The booking platform, admin dashboard, and FAQ/SEO layer are complete
(Phases 1–6). This phase adds the systems that make Sippi Lights attractive and
easy to evaluate for a buyer: financial visibility with SDE, physical asset
tracking, operational documentation, customer feedback capture, an upgraded
transfer checklist, and a one-click data room export.

All modules live inside `/admin`, gated by the existing owner-only Supabase
Auth. Phase 7B (built next) adds public display + moderation of reviews and
site analytics — this phase must produce the reviews table and capture flow it
depends on.

---

## 1. Financial dashboard — `/admin/financials`

- Revenue summary cards: This Month, Last Month, YTD, Trailing 12 Months —
  computed from `bookings.subtotal` where `status` is `completed` or
  `confirmed`.
- Monthly revenue trend chart (last 24 months).
- Deposit vs. balance collected breakdown.
- Average order value trend.
- Booking volume trend (count per month).
- Repeat customer rate: % of bookings where `customer_email` or
  `customer_phone` matches a prior completed booking.
- Customer concentration check: flag if any single customer/venue represents
  **>15%** of trailing-12-month revenue.

**Expenses** — new table `expenses`:

| Column | Type |
|---|---|
| `id` | uuid pk |
| `date` | date |
| `category` | text (`fuel`, `repairs`, `new_inventory`, `insurance`, `subscriptions`, `other`) |
| `amount` | numeric |
| `note` | text null |

Admin UI: add/edit/delete expense entries, monthly expense summary by category.

**SDE computation:** the financials page computes and displays Seller's
Discretionary Earnings = revenue (completed bookings) minus expenses, per month
and trailing 12 months. Label it plainly: "SDE (Seller's Discretionary
Earnings)".

**CSV export** for the full revenue table (date, customer, items, subtotal,
deposit, balance, status) **and** the expenses table — QuickBooks-import-friendly
column format.

---

## 2. Asset register — `/admin/inventory`

Extend the existing inventory management. New `inventory_items` columns:

- `purchase_date` date null
- `purchase_cost` numeric null
- `condition` text check in (`new`, `excellent`, `good`, `fair`,
  `needs_repair`, `retired`) default `excellent`
- `replacement_cost` numeric null
- `last_maintenance_date` date null
- `maintenance_notes` text null
- `usage_count` int default 0 — increment automatically when the item appears
  in a completed booking

Admin UI additions:

- Asset table view: item, condition, purchase cost, current est. value
  (straight-line depreciation over a configurable useful-life-years constant),
  usage count, last maintenance.
- Total asset value summary (sum of current est. value).
- Condition alerts: items marked `fair` or `needs_repair` surface in a
  dashboard widget.

**Demand signals** — new table `demand_signals`:

| Column | Type |
|---|---|
| `id` | uuid pk |
| `date` | date |
| `character` | char(1) null |
| `finish` | text null |
| `requested_qty` | int |
| `available_qty` | int |

Write a row whenever a requested character/finish/qty is **unavailable** at
availability check or checkout — log the event, do not just reject silently.
Admin widget: "Most-requested unavailable items, trailing 90 days."

---

## 3. Operations playbook — `/admin/playbook`

`src/content/playbook.ts` — structured SOP entries, each with: title, category
(Delivery, Setup, Teardown, Damage/Incident, Refund/Cancellation, Customer
Communication, Weather Call, Inventory Maintenance), ordered steps, notes.

Seed with real, complete SOPs for:

- standard delivery + setup
- teardown + pickup
- handling a damaged item at pickup
- processing a cancellation/refund per the rental agreement terms
- making an outdoor weather-cancellation call
- onboarding a new employee/subcontractor to do a delivery

Admin UI: browsable, printable/exportable to PDF per entry (reuse
`@react-pdf/renderer`).

---

## 4. Customer feedback capture

New table `reviews`:

| Column | Type |
|---|---|
| `id` | uuid pk |
| `booking_id` | uuid fk → `bookings` |
| `rating` | int check between 1 and 5 |
| `feedback_text` | text |
| `submitted_at` | timestamptz default now() |
| `permission_to_share` | bool default false |

**Public capture page:** route `/feedback/[token]` where token is a signed
token derived from `booking_id` — **do not expose raw booking ids in URLs**.
Form fields: star rating (1–5, required), feedback text (textarea, required),
permission checkbox "You may share my review on your website" (maps to
`permission_to_share`). One submission per booking — token invalid after a
successful submit.

**Email trigger:** modify the Phase 5 post-event thank-you email (sent 1 day
after `event_date` by the existing daily cron) to link to this
`/feedback/[token]` page as the review ask.

**Admin widget** on `/admin`: average rating trend, recent feedback feed, and
flagged low ratings (below 4) for owner follow-up.

**RLS:** anon may INSERT via the token flow only — validate the token
server-side in a Vercel function, **not** client-side. `reviews`
SELECT/UPDATE/DELETE owner-only. (Phase 7B adds the public display view and
moderation states.)

---

## 5. Business transfer checklist — `/admin/transfer`

Checklist page listing everything a new owner needs to take over, with
checkboxes persisting to a key-value table `transfer_checklist`. Items: domain
registrar, Vercel account, Supabase project, Stripe account, Resend account,
Google Business Profile, social media accounts, physical inventory location,
vendor/supplier contacts, insurance policy, **plus** business entity (LLC)
transfer/assignment, business bank account, QuickBooks access, portable
business phone number (a transferable business line, not a personal cell).

Task list only — **never store actual credentials in the app.**

---

## 6. Data room export — `/admin/export`

One button generates a zip using **JSZip** containing: financial CSV +
expenses CSV (§1), current asset register CSV, playbook PDFs, review summary
CSV, and a generated `overview.md` auto-populated from live data — total
bookings all-time, revenue trailing 12 months, SDE trailing 12 months, asset
count/value, average rating, repeat customer rate.

---

## Rules

- JSZip is the only pre-approved new dependency this phase. Any other new
  dependency must be listed in the phase report for Walt's approval (per
  `CLAUDE.md`).
- All new tables get RLS: owner-only read/write, same pattern as `bookings`
  (exception: `reviews` INSERT via the signed-token flow in §4).
- Reuse existing `tokens.css` and the admin layout — one cohesive dashboard,
  not a bolted-on module.

## Open decisions at the time (flag, do not guess)

- Useful-life-years constant for depreciation — a configurable constant exists;
  Walt had not set the number.
- Expense categories may be extended by Walt later; build categories as data,
  not hardcoded UI.
- Exact wording of the feedback email ask (tone rules apply: casually friendly,
  excited for the customer's event).

## Confirmation gate

Report: all six sub-systems functional, SDE math verified against test data,
feedback token flow tested end to end (email link → form → row created → token
invalidated), RLS confirmed on all new tables, CSV/PDF/zip exports tested,
clean build. Do **not** merge until Walt confirms.
