-- NNN League: full backend (already applied to the streak-tracker project via MCP).
-- Applied as migrations: schema, storage_run_screenshots, functions_core,
-- fix_case_insensitive_username_lookups. This file is the consolidated final state.

-- ============ schema ============
create extension if not exists citext with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique
    constraint username_format check (username::text ~ '^[A-Za-z0-9_]{3,20}$'),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);
create index profiles_username_lower_idx on public.profiles (lower(username::text));

create table public.checkins (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  nutted boolean not null,
  drank boolean not null,
  smoked boolean not null,
  ran boolean not null,
  screenshot_path text,
  points integer not null,
  streak integer not null,
  created_at timestamptz not null default now(),
  constraint one_checkin_per_day unique (user_id, day),
  constraint run_needs_screenshot check (ran = (screenshot_path is not null)),
  constraint screenshot_used_once unique (screenshot_path)
);
create index checkins_runs_feed_idx on public.checkins (created_at desc) where ran;

alter table public.profiles enable row level security;
alter table public.checkins enable row level security;

create policy "Read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Read own checkins" on public.checkins
  for select to authenticated using ((select auth.uid()) = user_id);

-- All writes go through SECURITY DEFINER functions below.
revoke insert, update, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.checkins from anon, authenticated;
revoke all on public.profiles from anon;
revoke all on public.checkins from anon;

-- ============ storage ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('run-screenshots', 'run-screenshots', true, 102400, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Upload own run screenshots" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'run-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "List own run screenshots" on storage.objects
  for select to authenticated
  using (bucket_id = 'run-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Delete own run screenshots" on storage.objects
  for delete to authenticated
  using (bucket_id = 'run-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ============ private helpers (not exposed by the API) ============
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.season_start() returns date
language sql immutable set search_path = '' as $$ select date '2026-11-01' $$;
create or replace function private.season_end() returns date
language sql immutable set search_path = '' as $$ select date '2026-11-30' $$;
create or replace function private.opens_at_time() returns time
language sql immutable set search_path = '' as $$ select time '21:00' $$;
create or replace function private.ist_local() returns timestamp
language sql stable set search_path = '' as $$ select now() at time zone 'Asia/Kolkata' $$;

create or replace function private.rules() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'no_nut', 50, 'run', 30, 'no_drink', 10, 'no_smoke', 10,
    'streak_bonus_per_day', 2, 'streak_bonus_cap', 20
  )
$$;

create or replace function private.standings()
returns table (
  user_id uuid, username text, joined_at timestamptz, rank bigint, points bigint,
  current_streak integer, no_nut_days bigint, runs bigint, days_logged bigint
)
language sql stable set search_path = '' as $$
  with ref as (
    select least(private.ist_local()::date, private.season_end()) as d
  ),
  agg as (
    select c.user_id,
           sum(c.points)::bigint as points,
           count(*) filter (where not c.nutted) as no_nut_days,
           count(*) filter (where c.ran) as runs,
           count(*) as days_logged
    from public.checkins c
    group by c.user_id
  ),
  latest as (
    select distinct on (c.user_id) c.user_id, c.day, c.streak
    from public.checkins c
    order by c.user_id, c.day desc
  ),
  merged as (
    select p.id as user_id, p.username::text as username, p.created_at as joined_at,
           coalesce(a.points, 0) as points,
           coalesce(case when l.day >= (select d from ref) - 1 then l.streak else 0 end, 0) as current_streak,
           coalesce(a.no_nut_days, 0) as no_nut_days,
           coalesce(a.runs, 0) as runs,
           coalesce(a.days_logged, 0) as days_logged
    from public.profiles p
    left join agg a on a.user_id = p.id
    left join latest l on l.user_id = p.id
  )
  select m.user_id, m.username, m.joined_at,
         row_number() over (order by m.points desc, m.current_streak desc, m.joined_at asc) as rank,
         m.points, m.current_streak, m.no_nut_days, m.runs, m.days_logged
  from merged m
$$;

create or replace function private.record_checkin(
  p_user uuid, p_day date,
  p_nutted boolean, p_drank boolean, p_smoked boolean, p_ran boolean,
  p_screenshot_path text
) returns jsonb
language plpgsql volatile set search_path = '' as $$
declare
  r jsonb := private.rules();
  prev_streak integer;
  new_streak integer;
  bonus integer;
  pts_no_nut integer;
  pts_run integer;
  pts_no_drink integer;
  pts_no_smoke integer;
  total integer;
begin
  select c.streak into prev_streak
  from public.checkins c
  where c.user_id = p_user and c.day = p_day - 1;
  prev_streak := coalesce(prev_streak, 0);

  new_streak   := case when p_nutted then 0 else prev_streak + 1 end;
  bonus        := case when p_nutted then 0
                       else least(prev_streak * (r->>'streak_bonus_per_day')::int, (r->>'streak_bonus_cap')::int) end;
  pts_no_nut   := case when p_nutted then 0 else (r->>'no_nut')::int end;
  pts_run      := case when p_ran then (r->>'run')::int else 0 end;
  pts_no_drink := case when p_drank then 0 else (r->>'no_drink')::int end;
  pts_no_smoke := case when p_smoked then 0 else (r->>'no_smoke')::int end;
  total := pts_no_nut + pts_run + pts_no_drink + pts_no_smoke + bonus;

  begin
    insert into public.checkins (user_id, day, nutted, drank, smoked, ran, screenshot_path, points, streak)
    values (p_user, p_day, p_nutted, p_drank, p_smoked, p_ran,
            case when p_ran then p_screenshot_path else null end, total, new_streak);
  exception when unique_violation then
    if exists (select 1 from public.checkins c where c.user_id = p_user and c.day = p_day) then
      raise exception 'ALREADY_CHECKED_IN';
    end if;
    raise exception 'SCREENSHOT_ALREADY_USED';
  end;

  return jsonb_build_object(
    'day', p_day, 'points', total, 'streak', new_streak,
    'breakdown', jsonb_build_object(
      'no_nut', pts_no_nut, 'run', pts_run, 'no_drink', pts_no_drink,
      'no_smoke', pts_no_smoke, 'streak_bonus', bonus
    )
  );
end;
$$;

-- ============ public API (RPC) ============
create or replace function public.app_status() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  local timestamp := private.ist_local();
  today date := local::date;
  s_start date := private.season_start();
  s_end date := private.season_end();
  open_t time := private.opens_at_time();
  state text;
  in_window boolean;
  next_open timestamptz;
begin
  state := case when today < s_start then 'upcoming' when today > s_end then 'ended' else 'active' end;
  in_window := state = 'active' and local::time >= open_t;

  if state = 'upcoming' then
    next_open := (s_start + open_t) at time zone 'Asia/Kolkata';
  elsif state = 'ended' then
    next_open := null;
  elsif local::time < open_t then
    next_open := (today + open_t) at time zone 'Asia/Kolkata';
  elsif today + 1 <= s_end then
    next_open := ((today + 1) + open_t) at time zone 'Asia/Kolkata';
  else
    next_open := null;
  end if;

  return jsonb_build_object(
    'now', now(), 'today', today, 'season_state', state,
    'season_start', s_start, 'season_end', s_end, 'window_open', in_window,
    'opens_at', (today + open_t) at time zone 'Asia/Kolkata',
    'closes_at', ((today + 1)::timestamp) at time zone 'Asia/Kolkata',
    'next_opens_at', next_open, 'rules', private.rules()
  );
end;
$$;

create or replace function public.is_username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_username ~ '^[A-Za-z0-9_]{3,20}$'
     and lower(p_username) not in ('admin', 'administrator', 'root', 'support', 'moderator', 'mod', 'null', 'undefined', 'me', 'api', 'system', 'official')
     and not exists (
       select 1 from public.profiles p
       where lower(p.username::text) = lower(p_username)
         and p.id is distinct from auth.uid()
     )
$$;

create or replace function public.claim_username(p_username text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  result public.profiles;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  p_username := trim(p_username);
  if p_username !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'USERNAME_INVALID'; end if;
  if not public.is_username_available(p_username) then raise exception 'USERNAME_TAKEN'; end if;
  begin
    insert into public.profiles (id, username) values (uid, p_username)
    on conflict (id) do update set username = excluded.username
    returning * into result;
  exception when unique_violation then
    raise exception 'USERNAME_TAKEN';
  end;
  return jsonb_build_object('username', result.username::text, 'onboarded', result.onboarded);
end;
$$;

create or replace function public.complete_onboarding() returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  update public.profiles set onboarded = true where id = auth.uid();
  if not found then raise exception 'NO_PROFILE'; end if;
end;
$$;

create or replace function public.submit_checkin(
  p_nutted boolean, p_drank boolean, p_smoked boolean, p_ran boolean,
  p_screenshot_path text default null
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  local timestamp := private.ist_local();
  today date := local::date;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_nutted is null or p_drank is null or p_smoked is null or p_ran is null then
    raise exception 'MISSING_ANSWERS';
  end if;
  if today < private.season_start() or today > private.season_end() then
    raise exception 'SEASON_NOT_ACTIVE';
  end if;
  if local::time < private.opens_at_time() then
    raise exception 'WINDOW_CLOSED';
  end if;
  if not exists (select 1 from public.profiles p where p.id = uid) then
    raise exception 'NO_PROFILE';
  end if;
  if p_ran then
    if p_screenshot_path is null
       or split_part(p_screenshot_path, '/', 1) <> uid::text
       or not exists (
         select 1 from storage.objects o
         where o.bucket_id = 'run-screenshots' and o.name = p_screenshot_path
       ) then
      raise exception 'SCREENSHOT_REQUIRED';
    end if;
  end if;
  return private.record_checkin(uid, today, p_nutted, p_drank, p_smoked, p_ran, p_screenshot_path);
end;
$$;

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
    'username', s.username, 'joined_at', s.joined_at, 'rank', s.rank,
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
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.get_leaderboard(p_limit integer default 100)
returns table (
  rank bigint, username text, points bigint, current_streak integer,
  no_nut_days bigint, runs bigint, days_logged bigint
)
language sql stable security definer set search_path = '' as $$
  select st.rank, st.username, st.points, st.current_streak, st.no_nut_days, st.runs, st.days_logged
  from private.standings() st
  order by st.rank
  limit greatest(1, least(coalesce(p_limit, 100), 100))
$$;

create or replace function public.get_run_feed(p_before timestamptz default null, p_limit integer default 24)
returns table (id bigint, username text, day date, screenshot_path text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, p.username::text, c.day, c.screenshot_path, c.created_at
  from public.checkins c
  join public.profiles p on p.id = c.user_id
  where c.ran and (p_before is null or c.created_at < p_before)
  order by c.created_at desc, c.id desc
  limit greatest(1, least(coalesce(p_limit, 24), 48))
$$;

create or replace function public.get_public_profile(p_username text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  s record;
begin
  select * into s from private.standings() st where lower(st.username) = lower(p_username);
  if not found then return null; end if;
  return jsonb_build_object(
    'username', s.username, 'joined_at', s.joined_at, 'rank', s.rank, 'points', s.points,
    'current_streak', s.current_streak, 'no_nut_days', s.no_nut_days, 'runs', s.runs,
    'days_logged', s.days_logged,
    'run_list', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'day', c.day, 'screenshot_path', c.screenshot_path)
                       order by c.day desc)
      from public.checkins c where c.user_id = s.user_id and c.ran
    ), '[]'::jsonb)
  );
end;
$$;

-- ============ grants ============
revoke execute on function private.season_start() from public, anon, authenticated;
revoke execute on function private.season_end() from public, anon, authenticated;
revoke execute on function private.opens_at_time() from public, anon, authenticated;
revoke execute on function private.ist_local() from public, anon, authenticated;
revoke execute on function private.rules() from public, anon, authenticated;
revoke execute on function private.standings() from public, anon, authenticated;
revoke execute on function private.record_checkin(uuid, date, boolean, boolean, boolean, boolean, text) from public, anon, authenticated;

revoke execute on function public.app_status() from public;
revoke execute on function public.get_leaderboard(integer) from public;
revoke execute on function public.get_run_feed(timestamptz, integer) from public;
revoke execute on function public.get_public_profile(text) from public;
revoke execute on function public.is_username_available(text) from public, anon;
revoke execute on function public.claim_username(text) from public, anon;
revoke execute on function public.complete_onboarding() from public, anon;
revoke execute on function public.submit_checkin(boolean, boolean, boolean, boolean, text) from public, anon;
revoke execute on function public.get_my_summary() from public, anon;

grant execute on function public.app_status() to anon, authenticated;
grant execute on function public.get_leaderboard(integer) to anon, authenticated;
grant execute on function public.get_run_feed(timestamptz, integer) to anon, authenticated;
grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.is_username_available(text) to authenticated;
grant execute on function public.claim_username(text) to authenticated;
grant execute on function public.complete_onboarding() to authenticated;
grant execute on function public.submit_checkin(boolean, boolean, boolean, boolean, text) to authenticated;
grant execute on function public.get_my_summary() to authenticated;

-- Account deletion is handled by the delete-account Edge Function (supabase/functions).
