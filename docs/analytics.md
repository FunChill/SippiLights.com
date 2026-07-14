# Sippi Lights — Analytics Guide

Written for whoever owns this business — no analytics background assumed.

## Where to look

**Owner Dashboard → "View Analytics ↗"** (top right of /admin), or directly:
Vercel → sippi-lights-com project → Analytics tab.

- **Visitors / Page Views** — how many people came and what they looked at,
  daily / weekly / monthly.
- **Events** — the five custom funnel events below.

No cookie banner is needed: Vercel Analytics is cookieless and stores no
personal data about visitors.

## The five funnel events

They fire in this order as a visitor moves toward a booking. Each is a step
down the funnel — the drop-off between steps tells you where to focus.

| # | Event | Fires when | What it tells you |
|---|-------|-----------|-------------------|
| 1 | `builder_used` | First character typed into the word builder (once per visit) | Visitor became engaged — they're imagining their event |
| 2 | `availability_checked` | The live availability check returns. Carries `result: available` or `unavailable` | Real purchase intent — they have a date. A high `unavailable` share means demand is outrunning the fleet (cross-check the "Most-Requested Unavailable" widget in /admin/inventory) |
| 3 | `checkout_started` | Customer accepted the rental agreement and clicked "Reserve My Date" | They committed — anything lost after this is friction or payment trouble |
| 4 | `booking_completed` | Stripe redirected back to the confirmed page — deposit paid | Money in. This is the conversion the whole site exists for |
| 5 | `inquiry_submitted` | Contact form sent | The side door — people who wanted a conversation instead of self-serve checkout |

## How to read the funnel

Example week: 500 visitors → 80 `builder_used` → 40 `availability_checked` →
10 `checkout_started` → 6 `booking_completed`.

- **Visitors → builder_used (16%)** — are the right people arriving? Low %
  means traffic quality (ads, SEO, social) is the problem, not the site.
- **builder_used → availability_checked (50%)** — do engaged visitors have a
  real date? This step is naturally lossy; watch the trend, not the level.
- **availability_checked → checkout_started (25%)** — the money step. If this
  drops, something between "it's available" and "reserve" is scaring people
  off: pricing clarity, agreement length, form friction.
- **checkout_started → booking_completed (60%)** — payment completion. If this
  drops suddenly, check Stripe first (webhooks, card errors) before touching
  the site.

**Rules of thumb**
- Compare week over week, not day over day — event bookings are weekend-lumpy.
- Fix the BIGGEST percentage drop first; ignore small wobbles.
- `booking_completed ÷ visitors` is the overall conversion rate. For a local
  event-rental site, ~1–2% is healthy.

## Why this matters beyond marketing

The funnel is growth evidence for a future buyer: "X visitors/month convert at
Y% with $Z average order" turns the website from a brochure into a measurable
booking machine — and the trend line is the proof it's growing.
