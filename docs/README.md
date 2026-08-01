# Sippi Lights — documentation index

## Phase records

The phase documents are the record of *why* decisions were made. Commit
messages capture the what; these capture the reasoning, the numbers Walt
confirmed, and the rules that must not drift.

| Phase | Subject | Document | Status |
|---|---|---|---|
| 1 | Scaffold + brand system | `../PHASE 1 — Scaffold + Brand System +.txt` | shipped |
| 2 | Inventory catalog + live availability | `../PHASE 2 — Inventory Catalog + Live.txt` | shipped |
| 3 | Supabase inventory + booking | `../PHASE 3 — Supabase Inventory, Booki.txt` | shipped |
| 4 | Checkout, logistics, Stripe deposit | `../PHASE 4-Checkout Date-Items-Logistics-Stripe Deposit.txt` | shipped |
| 5 | Rental agreement e-sign + emails | `../PHASE 5 — Rental Agreement E-Sign + Automated Emails.txt` | shipped |
| 6 | Admin dashboard, FAQ, local SEO/AEO | `../PHASE 6 — Admin Dashboard + FAQ + Local SEO-AEO + Spline Slot.txt` | shipped |
| 7 | Reviews + acquisition layer | **missing from the repo** — see below | shipped |
| 8 | Checkout UX, travel fee, payments, refunds | `phase-8-notes.md` | shipped (written after the fact) |
| 9 | SMS via Twilio + A2P 10DLC | `sms-phase-plan.md` | planned, not built |
| 10 | Inquiry response assistant | `phase-10-inquiry-response-assistant.md` | planned, not built |

### Phase 7 — action needed

The Phase 7 code is committed (`src/lib/phase7.ts` and the two
`*_phase7*.sql` migrations), but its spec document is **not in the repo**. A
file named `PHASE 7 - Reviews etc.txt` exists on Walt's local machine only. It
is not gitignored — it was simply never committed.

**To fix:** copy that file into `docs/phase-7-reviews.md` and commit it. Until
then it exists in exactly one place, on one hard drive.

### Phase 8 — written after the fact

Phase 8 shipped without a spec. `phase-8-notes.md` reconstructs it from the
merge commits and the code, and is labelled as a record rather than a plan.
The full original rationale is in the commit bodies of `fc9e6db` and `4d6a30a`,
which are unusually detailed — read those if the notes are ever in doubt.

## Other documents

| Document | Subject |
|---|---|
| `analytics.md` | What is tracked, where, and why |

## Open items across phases

- **`TRAVEL_FEE_BEYOND_25`** in `src/config/pricing.ts` is marked *PENDING
  WALT'S FINAL NUMBER*. One constant. Until it is set, no customer-facing
  surface should state a travel-fee dollar amount. (Phase 8)
- **A2P 10DLC registration** gates all of Phase 9 and should be started before
  any SMS code is written. EIN details must match IRS records exactly.
- **Phase 9 open decisions** — dedicated texting number vs. porting
  (601) 813-2464; whether the post-event feedback ask goes by text.
- **Phase 10 open decisions** — referral vs. plain decline for out-of-area;
  whether the drafter proposes alternative dates automatically.
