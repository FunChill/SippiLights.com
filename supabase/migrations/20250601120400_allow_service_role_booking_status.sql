-- Sippi Lights — let trusted server-side inserts set a real booking status
--
-- Phase 3's trigger forced every inserted booking to status='inquiry' and
-- deposit_paid=false, regardless of role — that was correct for blocking
-- anon from faking a paid/confirmed booking, but Phase 4's checkout flow
-- needs to legitimately create a booking as 'pending_deposit' BEFORE
-- redirecting to Stripe (so the availability engine reserves that inventory
-- during the payment window). That insert happens server-side, in the
-- create-checkout-session function, authenticated as service_role — which
-- the browser can never be. Only the anon/authenticated path is now forced.

create or replace function enforce_inquiry_status()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.status := 'inquiry';
    new.deposit_paid := false;
  end if;
  return new;
end;
$$;
