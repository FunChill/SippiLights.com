-- Sippi Lights — flexible payment amounts + owner-initiated refunds.
--
-- amount_paid: what the customer ACTUALLY paid at checkout. The deposit is now
-- a minimum, not a fixed figure — customers may pay more, up to the full order
-- total. deposit_due stays as the required minimum for that order.
--
-- paid_in_full: set when amount_paid covers the whole order, so delivery crews
-- see it plainly and the balance-collection step is skipped.
--
-- stripe_payment_intent_id: required to refund from the admin dashboard
-- instead of logging into Stripe.

alter table bookings
  add column if not exists amount_paid numeric,
  add column if not exists paid_in_full bool not null default false,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_amount numeric;

create index if not exists bookings_payment_intent_idx
  on bookings (stripe_payment_intent_id);
