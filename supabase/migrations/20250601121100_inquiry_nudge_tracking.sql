-- Sippi Lights — "not ready to book yet" inquiry path.
--
-- A customer who builds a full order but isn't ready to put money down is a
-- warm lead, not a lost one. Those save as status 'inquiry' with the whole
-- order attached, and get one nudge email 14 days later (Walt's call) to
-- bring them back while their event is still being planned.
--
-- Nullable timestamp, set once when the nudge sends, so the daily cron can
-- never double-send even if it reruns or a day is missed.

alter table bookings
  add column if not exists inquiry_nudge_sent_at timestamptz;
