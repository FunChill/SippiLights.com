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
| 7 | Acquisition-readiness layer (financials/SDE, assets, playbook, feedback, transfer, data room) | `phase-7-acquisition-layer.md` | shipped |
| 8 | Checkout UX, travel fee, payments, refunds | `phase-8-notes.md` | shipped (written after the fact) |
| 9 | SMS via Twilio + A2P 10DLC | `sms-phase-plan.md` | planned, not built |
| 10 | Inquiry response assistant | `phase-10-inquiry-response-assistant.md` | planned, not built |

### Phase 8 — written after the fact

Phase 8 shipped without a spec. `phase-8-notes.md` reconstructs it from the
merge commits and the code, and is labelled as a record rather than a plan.
The full original rationale is in the commit bodies of `fc9e6db` and `4d6a30a`,
which are unusually detailed — read those if the notes are ever in doubt.

## Other documents

| Document | Subject |
|---|---|
| `analytics.md` | What is tracked, where, and why |
| `review-channel-decision.md` | How reviews are asked for and displayed; what is still undecided |

## Open items across phases

- **Google cross-post invitation is undecided** (`review-channel-decision.md`
  §2). Do not build rating-gated Google review prompts — inviting only happy
  customers violates Google's review policies. The compliant design asks every
  customer, after the on-site review is captured. (Phase 7)
- **Whether the Google review link stays in the post-event thank-you email**
  alongside the new `/feedback` ask. Until decided, leave it unchanged.
  (Phase 7)
- **Useful-life-years constant** for asset depreciation was never set by Walt.
  (Phase 7 §2)
- **A2P 10DLC registration** gates all of Phase 9 and should be started before
  any SMS code is written. EIN details must match IRS records exactly.
- **Phase 9 open decisions** — dedicated texting number vs. porting
  (601) 813-2464; whether the post-event feedback ask goes by text.
- **Phase 10 open decisions** — referral vs. plain decline for out-of-area;
  whether the drafter proposes alternative dates automatically.
