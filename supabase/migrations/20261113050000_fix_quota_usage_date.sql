-- Fix: RETURNS TABLE(... usage_date ...) made "usage_date" ambiguous vs table columns.
drop function if exists public.reserve_transcript_quota(uuid, text, integer);

create function public.reserve_transcript_quota(
  p_user_id uuid,
  p_request_key text,
  p_daily_limit integer default 3
)
returns table (
  reserved boolean,
  already_reserved boolean,
  transcripts_used integer,
  quota_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (timezone('utc', now()))::date;
  v_plan public.plan_tier;
  v_used integer;
  v_inserted boolean := false;
begin
  if p_user_id is null or p_request_key is null or length(trim(p_request_key)) = 0 then
    raise exception 'user_id and request_key are required';
  end if;

  if auth.uid() is not null and auth.uid() <> p_user_id and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  if exists (
    select 1 from public.quota_reservations q where q.request_key = p_request_key
  ) then
    select d.transcripts_used into v_used
    from public.daily_usage d
    where d.user_id = p_user_id and d.usage_date = v_date;

    return query select false, true, coalesce(v_used, 0), v_date;
    return;
  end if;

  select p.plan into v_plan from public.profiles p where p.id = p_user_id;
  if v_plan is null then
    raise exception 'profile not found';
  end if;

  insert into public.daily_usage as du (user_id, usage_date, transcripts_used)
  values (p_user_id, v_date, 0)
  on conflict (user_id, usage_date) do nothing;

  select d.transcripts_used into v_used
  from public.daily_usage d
  where d.user_id = p_user_id and d.usage_date = v_date
  for update;

  if v_plan = 'free' and v_used >= p_daily_limit then
    return query select false, false, v_used, v_date;
    return;
  end if;

  begin
    insert into public.quota_reservations as qr (request_key, user_id, usage_date)
    values (p_request_key, p_user_id, v_date);
    v_inserted := true;
  exception when unique_violation then
    select d.transcripts_used into v_used
    from public.daily_usage d
    where d.user_id = p_user_id and d.usage_date = v_date;

    return query select false, true, coalesce(v_used, 0), v_date;
    return;
  end;

  if v_inserted and v_plan = 'free' then
    update public.daily_usage d
    set transcripts_used = d.transcripts_used + 1
    where d.user_id = p_user_id and d.usage_date = v_date
    returning d.transcripts_used into v_used;
  end if;

  return query select true, false, coalesce(v_used, 0), v_date;
end;
$$;

revoke all on function public.reserve_transcript_quota(uuid, text, integer) from public;
grant execute on function public.reserve_transcript_quota(uuid, text, integer) to authenticated, service_role;
