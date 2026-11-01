-- Late joiners can log up to 5 of the days they missed before joining.
-- Past days ask only nut / drink / smoke (no runs, so no screenshot needed).

-- Days a user may still backfill: the 5 days before their join day (IST),
-- clipped to the season, minus days already logged. Empty for anyone who
-- joined on or before the first day, and once the season is over.
create or replace function private.backfill_days(p_user uuid) returns setof date
language sql stable set search_path = '' as $$
  with j as (
    select (p.created_at at time zone 'Asia/Kolkata')::date as joined
    from public.profiles p
    where p.id = p_user
  ),
  bounds as (
    select greatest(private.season_start(), j.joined - 5) as lo,
           least(j.joined - 1, private.ist_local()::date - 1, private.season_end()) as hi
    from j
    where j.joined > private.season_start()
      and private.ist_local()::date <= private.season_end()
  )
  select g::date
  from bounds, generate_series(bounds.lo, bounds.hi, interval '1 day') g
  where not exists (
    select 1 from public.checkins c where c.user_id = p_user and c.day = g::date
  )
  order by 1
$$;

-- Recomputes streak and points for every check-in of a user, in day order.
-- Same scoring as private.record_checkin. Needed because a backfilled day can
-- land before days that were already scored.
create or replace function private.recompute_user(p_user uuid) returns void
language plpgsql volatile set search_path = '' as $$
declare
  r jsonb := private.rules();
  c record;
  prev_day date := null;
  prev_streak integer := 0;
  s integer;
  bonus integer;
  total integer;
begin
  for c in
    select ch.id, ch.day, ch.nutted, ch.drank, ch.smoked, ch.ran, ch.points, ch.streak
    from public.checkins ch
    where ch.user_id = p_user
    order by ch.day
    for update
  loop
    if prev_day is null or c.day <> prev_day + 1 then
      prev_streak := 0;
    end if;
    s := case when c.nutted then 0 else prev_streak + 1 end;
    bonus := case when c.nutted then 0
                  else least(prev_streak * (r->>'streak_bonus_per_day')::int, (r->>'streak_bonus_cap')::int) end;
    total := (case when c.nutted then 0 else (r->>'no_nut')::int end)
           + (case when c.ran then (r->>'run')::int else 0 end)
           + (case when c.drank then 0 else (r->>'no_drink')::int end)
           + (case when c.smoked then 0 else (r->>'no_smoke')::int end)
           + bonus;
    if c.streak <> s or c.points <> total then
      update public.checkins set streak = s, points = total where id = c.id;
    end if;
    prev_day := c.day;
    prev_streak := s;
  end loop;
end;
$$;

-- p_entries: [{ "day": "2026-11-07", "nutted": false, "drank": false, "smoked": true }, ...]
create or replace function public.submit_backfill(p_entries jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  allowed date[];
  filled date[] := '{}';
  e jsonb;
  d date;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.profiles p where p.id = uid) then
    raise exception 'NO_PROFILE';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) = 0 then
    raise exception 'MISSING_ANSWERS';
  end if;

  select coalesce(array_agg(x), '{}') into allowed from private.backfill_days(uid) x;

  for e in select value from jsonb_array_elements(p_entries) loop
    if jsonb_typeof(e->'nutted') is distinct from 'boolean'
       or jsonb_typeof(e->'drank') is distinct from 'boolean'
       or jsonb_typeof(e->'smoked') is distinct from 'boolean'
       or jsonb_typeof(e->'day') is distinct from 'string' then
      raise exception 'MISSING_ANSWERS';
    end if;
    begin
      d := (e->>'day')::date;
    exception when others then
      raise exception 'BACKFILL_NOT_ALLOWED';
    end;
    if not (d = any (allowed)) then
      raise exception 'BACKFILL_NOT_ALLOWED';
    end if;
    allowed := array_remove(allowed, d);

    -- Placeholder score; recompute_user sets the real streak and points below.
    insert into public.checkins (user_id, day, nutted, drank, smoked, ran, screenshot_path, points, streak)
    values (uid, d, (e->>'nutted')::boolean, (e->>'drank')::boolean, (e->>'smoked')::boolean,
            false, null, 0, 0);
    filled := filled || d;
  end loop;

  perform private.recompute_user(uid);

  return jsonb_build_object(
    'filled', cardinality(filled),
    'points', (select coalesce(sum(c.points), 0) from public.checkins c
               where c.user_id = uid and c.day = any (filled))
  );
end;
$$;

-- Summary now carries the join day and the days still open for backfill.
create or replace function public.get_my_summary() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  s record;
  today date := private.ist_local()::date;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into s from private.standings() st where st.user_id = uid;
  if not found then return null; end if;
  return jsonb_build_object(
    'username', s.username, 'joined_at', s.joined_at,
    'joined_day', (s.joined_at at time zone 'Asia/Kolkata')::date,
    'rank', s.rank,
    'total_users', (select count(*) from public.profiles),
    'points', s.points, 'current_streak', s.current_streak,
    'no_nut_days', s.no_nut_days, 'runs', s.runs, 'days_logged', s.days_logged,
    'today', (
      select jsonb_build_object(
        'day', c.day, 'points', c.points, 'streak', c.streak,
        'nutted', c.nutted, 'drank', c.drank, 'smoked', c.smoked, 'ran', c.ran,
        'screenshot_path', c.screenshot_path)
      from public.checkins c where c.user_id = uid and c.day = today
    ),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day', c.day, 'points', c.points, 'streak', c.streak,
        'nutted', c.nutted, 'drank', c.drank, 'smoked', c.smoked, 'ran', c.ran) order by c.day)
      from public.checkins c where c.user_id = uid
    ), '[]'::jsonb),
    'backfill_days', coalesce((
      select jsonb_agg(b order by b) from private.backfill_days(uid) b
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function private.backfill_days(uuid) from public, anon, authenticated;
revoke execute on function private.recompute_user(uuid) from public, anon, authenticated;
revoke execute on function public.submit_backfill(jsonb) from public, anon;
grant execute on function public.submit_backfill(jsonb) to authenticated;
