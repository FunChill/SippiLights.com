-- Sippi Lights — Row Level Security
-- inventory_items: public read (active only)
-- bookings: public insert only (status/deposit forced server-side), owner-only read/update/delete
-- availability_blocks: public read (no PII), owner-only write

alter table inventory_items enable row level security;
alter table bookings enable row level security;
alter table availability_blocks enable row level security;

-- inventory_items ---------------------------------------------------------
create policy "public read active inventory"
  on inventory_items for select
  using (active = true);

grant select on inventory_items to anon, authenticated;

-- bookings ------------------------------------------------------------------
-- Force every publicly-submitted booking to a safe inquiry state, regardless
-- of what the client sends, so anon can never insert a pre-confirmed/paid row.
create or replace function enforce_inquiry_status()
returns trigger
language plpgsql
as $$
begin
  new.status := 'inquiry';
  new.deposit_paid := false;
  return new;
end;
$$;

create trigger bookings_force_inquiry
  before insert on bookings
  for each row execute function enforce_inquiry_status();

create policy "public insert bookings"
  on bookings for insert
  with check (true);

create policy "owner select bookings"
  on bookings for select
  to authenticated
  using (true);

create policy "owner update bookings"
  on bookings for update
  to authenticated
  using (true);

create policy "owner delete bookings"
  on bookings for delete
  to authenticated
  using (true);

grant insert on bookings to anon, authenticated;
grant select, update, delete on bookings to authenticated;

-- availability_blocks ---------------------------------------------------------
create policy "public read availability blocks"
  on availability_blocks for select
  using (true);

create policy "owner manage availability blocks"
  on availability_blocks for all
  to authenticated
  using (true)
  with check (true);

grant select on availability_blocks to anon, authenticated;
grant insert, update, delete on availability_blocks to authenticated;
