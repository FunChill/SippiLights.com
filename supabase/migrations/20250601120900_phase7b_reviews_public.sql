-- Sippi Lights — Phase 7B: review moderation + public display pipeline.
-- Adds owner moderation state and a locked-down public view. The reviews base
-- table stays owner-only; the public reads ONLY this view.

-- 1) Moderation state ---------------------------------------------------------
alter table reviews
  add column if not exists display_status text not null default 'pending'
    check (display_status in ('pending', 'approved', 'hidden'));

-- 2) Public view ---------------------------------------------------------------
-- Deliberately a definer-rights view (Postgres default): it must bypass the
-- base tables' owner-only RLS to serve anon, and it exposes ONLY these five
-- fields, ONLY for rows the owner explicitly approved AND the customer
-- explicitly permitted. Never expose email, phone, venue, full name, booking id.
create or replace view public_reviews as
select
  r.rating,
  r.feedback_text,
  -- "Sarah W." — first name plus last initial; just the first name if that's all we have
  case
    when split_part(trim(b.customer_name), ' ', 2) <> ''
      then split_part(trim(b.customer_name), ' ', 1) || ' ' ||
           upper(left(split_part(trim(b.customer_name), ' ', 2), 1)) || '.'
    else split_part(trim(b.customer_name), ' ', 1)
  end as first_name_display,
  b.event_type as occasion,
  to_char(b.event_date, 'FMMonth YYYY') as event_month
from reviews r
join bookings b on b.id = r.booking_id
where r.display_status = 'approved'
  and r.permission_to_share = true
order by r.submitted_at desc;

grant select on public_reviews to anon, authenticated;
