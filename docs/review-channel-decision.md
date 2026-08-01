# Sippi Lights — Review Channel Decision

Companion to Phase 7 §4 (`phase-7-acquisition-layer.md`) and Phase 7B's
moderation queue. Records what was settled about how reviews are asked for and
displayed — and, importantly, what was **not**.

---

## 1. Single review-ask flow — DECIDED

The post-event thank-you email (sent 1 day after `event_date` via the existing
daily cron) is the **single** review ask. It links to `/feedback/[token]`, a
signed-token page unique to the booking.

Sequence:

```
event completes → +1 day → thank-you email → customer taps link
  → star rating (1–5) + feedback text + "you may share my review
    on your website" checkbox
  → submit → token invalidated (one submission per booking)
```

On-site review capture is the primary channel **because Sippi Lights owns that
data.**

## 2. Google cross-post invitation — NOT DECIDED

A `GOOGLE_REVIEW_URL` env var and a Google review link exist from Phase 5, and
it was agreed Google Profile reviews would be "worked out later." No decision
was made on which star ratings trigger a Google invite, what the customer sees,
or a one-click copy/link mechanic.

> ⚠️ **Do not build rating-gated Google prompts.** Rating-gating a Google review
> ask — inviting only happy customers — violates Google's review policies. This
> needs a deliberate decision with Walt before anything is built.
>
> The compliant shape, when it is designed: **ask everyone, not just happy
> customers**, after the on-site review is captured.

## 3. Three-star-and-below feedback — PARTIALLY DECIDED

Ratings below 4 are flagged in the admin dashboard for owner follow-up.

Nothing goes public without owner approval: Phase 7B's moderation queue means
every review defaults to `pending` and displays only after Walt explicitly
approves it. **Review text is never editable — approve or hide only.**

It was **not** decided that low ratings are permanently barred from public
display. Owner moderation is the control, not a rating floor.

## 4. Changes to the existing thank-you email — PARTIALLY DECIDED

**Decided:** the email's review ask now points to `/feedback/[token]`
(Phase 7 §4).

**Not decided:** whether the original Google review link stays in the same
email alongside it, moves to a later touchpoint, or is removed.

Until §2 is settled: **leave the Google link in the email unchanged and add the
`/feedback` link as the primary ask.**

---

## The one real gap

Point 2. When Walt is ready, design the Google cross-post flow properly — the
compliant version asks every customer, after the on-site review is captured,
with no rating gate.
