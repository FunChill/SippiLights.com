-- Sippi Lights — booked-dates range function for the /book calendar step
-- Returns which dates in a range have at least one real booking, so the
-- calendar can shade them at a glance. No customer data, no character
-- detail — just "this date has activity" for a single-date deep-check via
-- get_booked_quantities once picked.

create or replace function get_booked_dates(start_date date, end_date date)
returns table (event_date date)
language sql
security definer
set search_path = public
stable
as $$
  select distinct bookings.event_date
  from bookings
  where bookings.event_date between start_date and end_date
    and bookings.status in ('pending_deposit', 'confirmed');
$$;

revoke all on function get_booked_dates(date, date) from public;
grant execute on function get_booked_dates(date, date) to anon, authenticated;
