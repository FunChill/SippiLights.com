-- Sippi Lights — Phase 6: owner/admin permissions
-- The admin dashboard signs in with Supabase Auth (email+password, owner
-- only — disable public sign-ups in Supabase Auth settings). Authenticated
-- therefore means Walt.

-- Owner can see ALL inventory (including inactive) and toggle items for repairs.
create policy "owner read all inventory"
  on inventory_items for select
  to authenticated
  using (true);

create policy "owner update inventory"
  on inventory_items for update
  to authenticated
  using (true)
  with check (true);

grant update on inventory_items to authenticated;

-- Manual bookings from the dashboard (phone customers) need real statuses;
-- keep forcing safe inquiry state for anon only.
create or replace function enforce_inquiry_status()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'anon' then
    new.status := 'inquiry';
    new.deposit_paid := false;
  end if;
  return new;
end;
$$;
