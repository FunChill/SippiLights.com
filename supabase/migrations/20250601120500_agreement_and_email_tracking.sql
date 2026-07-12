-- Sippi Lights — Phase 5: agreement acceptance + email lifecycle tracking

alter table bookings
  add column agreement_accepted_at timestamptz,
  add column agreement_name text,
  add column agreement_version text,
  add column agreement_pdf_path text,
  add column confirmation_email_sent_at timestamptz,
  add column reminder_email_sent_at timestamptz,
  add column thankyou_email_sent_at timestamptz;

-- Private bucket for generated agreement PDFs — owner-only access.
insert into storage.buckets (id, name, public)
values ('agreements', 'agreements', false)
on conflict (id) do nothing;

create policy "owner read agreements"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'agreements');
