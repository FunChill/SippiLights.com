-- Sippi Lights — Phase 7: acquisition-readiness layer
-- expenses, reviews, demand_signals, transfer_checklist tables;
-- bookings balance-collection + feedback token; inventory asset columns;
-- usage_count auto-increment on completed bookings.

-- 1) BOOKINGS: balance collection tracking + feedback token -----------------
alter table bookings
  add column if not exists balance_collected_at timestamptz,
  add column if not exists balance_payment_method text
    check (balance_payment_method in ('cash', 'card', 'other')),
  add column if not exists feedback_token uuid not null default gen_random_uuid();

create unique index if not exists bookings_feedback_token_idx
  on bookings (feedback_token);

-- 2) EXPENSES ----------------------------------------------------------------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null,
  amount numeric not null check (amount >= 0),
  note text
);

create index expenses_date_idx on expenses (date);

alter table expenses enable row level security;

create policy "owner manage expenses"
  on expenses for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on expenses to authenticated;

-- 3) REVIEWS -----------------------------------------------------------------
-- Inserted ONLY by the server-side feedback API (service_role bypasses RLS)
-- after validating the booking's feedback_token. unique(booking_id) enforces
-- one submission per booking at the database level.
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  feedback_text text not null,
  submitted_at timestamptz not null default now(),
  permission_to_share bool not null default false
);

alter table reviews enable row level security;

create policy "owner manage reviews"
  on reviews for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on reviews to authenticated;
-- No anon grants: the public submits through the token-validated Vercel
-- function, never directly. (Phase 7B adds the moderated public view.)

-- 4) DEMAND SIGNALS ------------------------------------------------------------
-- One row per (event date, character, finish) per calendar day, written by the
-- server-side log API when an availability check or checkout finds an item
-- unavailable. logged_on + the unique index de-duplicates builder keystroke
-- storms into a single daily signal.
create table demand_signals (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  char_value char(1),
  finish text,
  requested_qty int not null default 1,
  available_qty int not null default 0,
  logged_on date not null default current_date
);

create unique index demand_signals_daily_idx
  on demand_signals (date, char_value, finish, logged_on);

alter table demand_signals enable row level security;

create policy "owner read demand signals"
  on demand_signals for select
  to authenticated
  using (true);

grant select on demand_signals to authenticated;
-- Writes come from the service-role API only.

-- 5) TRANSFER CHECKLIST --------------------------------------------------------
create table transfer_checklist (
  key text primary key,
  checked bool not null default false,
  checked_at timestamptz
);

alter table transfer_checklist enable row level security;

create policy "owner manage transfer checklist"
  on transfer_checklist for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on transfer_checklist to authenticated;

-- 6) INVENTORY: asset register columns -----------------------------------------
alter table inventory_items
  add column if not exists purchase_date date,
  add column if not exists purchase_cost numeric,
  add column if not exists condition text not null default 'excellent'
    check (condition in ('new', 'excellent', 'good', 'fair', 'needs_repair', 'retired')),
  add column if not exists replacement_cost numeric,
  add column if not exists last_maintenance_date date,
  add column if not exists maintenance_notes text,
  add column if not exists usage_count int not null default 0;

-- 7) USAGE COUNT: auto-increment when a booking completes ----------------------
-- items jsonb rows look like {"character":"J","finish":"white","qty":1,...}.
-- Security definer so the owner's dashboard status change (authenticated role,
-- which has no inventory insert rights) can still bump counts.
create or replace function increment_usage_on_complete()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update inventory_items as i
    set usage_count = usage_count + coalesce((item->>'qty')::int, 1)
    from jsonb_array_elements(new.items) as item
    where i.char_value is not null
      and i.char_value = upper(item->>'character')
      and i.finish = item->>'finish';
  end if;
  return new;
end;
$$;

create trigger bookings_increment_usage
  after update on bookings
  for each row execute function increment_usage_on_complete();
