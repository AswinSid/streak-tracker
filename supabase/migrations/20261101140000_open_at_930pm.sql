-- Nightly check-in now opens at 9:30 PM IST (was 9:00 PM). Still closes at 11:59 PM IST.
-- app_status, submit_checkin and the countdowns all read this one function.
create or replace function private.opens_at_time() returns time
language sql immutable set search_path = '' as $$ select time '21:30' $$;

revoke execute on function private.opens_at_time() from public, anon, authenticated;
