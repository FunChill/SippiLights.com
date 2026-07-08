-- Sippi Lights — availability aggregate function
-- Returns booked qty per character+finish for a given date, counting only
-- bookings that hold real inventory (pending_deposit / confirmed). SECURITY
-- DEFINER lets anon call this without direct SELECT rights on bookings —
-- it returns aggregates only, never customer rows.

create or replace function get_booked_quantities(check_date date)
returns table (char_value char(1), finish text, qty bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    (item ->> 'character')::char(1) as char_value,
    item ->> 'finish' as finish,
    sum(coalesce((item ->> 'qty')::int, 1)) as qty
  from bookings, jsonb_array_elements(bookings.items) as item
  where bookings.event_date = check_date
    and bookings.status in ('pending_deposit', 'confirmed')
  group by 1, 2;
$$;

revoke all on function get_booked_quantities(date) from public;
grant execute on function get_booked_quantities(date) to anon, authenticated;
