-- Sippi Lights — stop exposing the booking schedule to the public.
--
-- get_booked_dates() returns which dates have bookings. The customer-facing
-- calendar no longer displays that (it revealed how busy the schedule is,
-- which helps no customer and is the owner's business alone), so the anon
-- grant is revoked here too — otherwise the data stays readable by anyone
-- calling the API directly, regardless of what the UI shows.
--
-- The owner's dashboard reads bookings through the authenticated role, so
-- admin views are unaffected. Per-item availability (get_booked_quantities)
-- is untouched — it answers "is YOUR word free on YOUR date" without ever
-- listing the calendar.

revoke execute on function get_booked_dates(date, date) from anon;
