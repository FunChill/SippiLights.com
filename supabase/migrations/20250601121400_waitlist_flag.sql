-- Sippi Lights — waitlist flag.
--
-- The one piece of pipeline state that cannot be derived. Every stage badge in
-- the dashboard is read from things that already happened (a reply sent, a
-- deposit paid, an event delivered) precisely so nothing has to be maintained
-- by hand. This is the exception: it records the customer's own answer to
-- "would you like us to reach out if that date opens up?", which exists
-- nowhere else.
--
-- Deliberately NOT a hold. A waitlisted customer has no claim on the date and
-- no inventory is reserved for them — it is permission to make a phone call.

alter table bookings
  add column if not exists waitlist_requested bool not null default false;

create index if not exists bookings_waitlist_idx
  on bookings (waitlist_requested)
  where waitlist_requested = true;
