-- Sippi Lights — release abandoned pending_deposit bookings via pg_cron.
-- Runs in the database every 15 minutes, replacing the Vercel cron for this
-- job (Vercel Hobby only allows daily crons). /api/release-abandoned-bookings
-- still exists as a manual fallback.

create extension if not exists pg_cron;

select cron.schedule(
  'release-abandoned-bookings',
  '*/15 * * * *',
  $$
    update bookings
    set status = 'cancelled'
    where status = 'pending_deposit'
      and created_at < now() - interval '60 minutes'
  $$
);
