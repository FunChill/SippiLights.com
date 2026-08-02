-- Sippi Lights — Phase 10: inquiry message log + drafted replies.
--
-- Every inbound customer message Walt drafts a reply to, with the triage
-- verdict and the draft itself. booking_id is nullable on purpose: a Facebook
-- Marketplace or Messenger message often arrives before any booking exists,
-- and those still need triage and a draft.
--
-- draft_model records which model produced the text, so a later change in
-- quality can be traced to a model change rather than guessed at.
--
-- Nothing here sends anything. approved_at/sent_at are set by Walt's action in
-- the admin dashboard, never automatically.

create table if not exists inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  booking_id uuid references bookings(id) on delete cascade,
  channel text not null
    check (channel in ('web', 'messenger', 'sms', 'email', 'phone')),
  direction text not null
    check (direction in ('inbound', 'outbound')),
  body text not null,
  triage text
    check (triage in ('qualified', 'question', 'out_of_area', 'spam', 'scam')),
  draft text,
  draft_model text,
  approved_at timestamptz,
  sent_at timestamptz
);

create index if not exists inquiry_messages_booking_idx
  on inquiry_messages (booking_id);
create index if not exists inquiry_messages_created_idx
  on inquiry_messages (created_at desc);
create index if not exists inquiry_messages_triage_idx
  on inquiry_messages (triage);

-- Owner-only, same pattern as bookings. Customer messages can contain phone
-- numbers, addresses, and event details — none of it is public.
alter table inquiry_messages enable row level security;

create policy "Owner can read inquiry messages"
  on inquiry_messages for select
  to authenticated
  using (true);

create policy "Owner can insert inquiry messages"
  on inquiry_messages for insert
  to authenticated
  with check (true);

create policy "Owner can update inquiry messages"
  on inquiry_messages for update
  to authenticated
  using (true);

create policy "Owner can delete inquiry messages"
  on inquiry_messages for delete
  to authenticated
  using (true);

-- Matches the grant pattern in 20250601120100_rls_policies.sql. No anon grant:
-- unlike bookings, nothing public ever writes here.
grant select, insert, update, delete on inquiry_messages to authenticated;
