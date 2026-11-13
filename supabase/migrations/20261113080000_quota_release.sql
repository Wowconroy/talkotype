-- Release daily free-plan quota when a reservation is abandoned or soft-deleted.

create or replace function public.release_transcript_quota(p_request_key text)
returns table (
  released boolean,
  transcripts_used integer,
  quota_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_usage_date date;
  v_plan public.plan_tier;
  v_used integer := 0;
  v_today date := (timezone('utc', now()))::date;
begin
  if p_request_key is null or length(trim(p_request_key)) = 0 then
    raise exception 'request_key is required';
  end if;

  delete from public.quota_reservations q
  where q.request_key = p_request_key
  returning q.user_id, q.usage_date into v_user_id, v_usage_date;

  if v_user_id is null then
    return query select false, 0, v_today;
    return;
  end if;

  if auth.uid() is not null
    and auth.uid() <> v_user_id
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  select p.plan into v_plan from public.profiles p where p.id = v_user_id;

  if v_plan = 'free' and v_usage_date = v_today then
    update public.daily_usage d
    set transcripts_used = greatest(d.transcripts_used - 1, 0)
    where d.user_id = v_user_id and d.usage_date = v_today
    returning d.transcripts_used into v_used;
  else
    select d.transcripts_used into v_used
    from public.daily_usage d
    where d.user_id = v_user_id and d.usage_date = v_today;
  end if;

  return query select true, coalesce(v_used, 0), coalesce(v_usage_date, v_today);
end;
$$;

revoke all on function public.release_transcript_quota(text) from public;
grant execute on function public.release_transcript_quota(text) to authenticated, service_role;

-- Soft-delete: free same-day quota tied to the job request_key.
create or replace function public.soft_delete_transcript(p_transcript_id uuid)
returns public.transcripts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.transcripts;
  v_request_key text;
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  update public.transcripts t
  set deleted_at = now(),
      updated_at = now()
  where t.id = p_transcript_id
    and t.deleted_at is null
    and (
      coalesce(auth.role(), '') = 'service_role'
      or t.user_id = auth.uid()
    )
  returning * into v_row;

  if not found then
    raise exception 'transcript not found';
  end if;

  update public.media_assets m
  set deleted_at = now(),
      status = 'deleted'
  where m.transcript_id = p_transcript_id
    and m.deleted_at is null;

  select j.request_key into v_request_key
  from public.transcription_jobs j
  where j.transcript_id = p_transcript_id
    and j.request_key is not null
  order by j.created_at desc nulls last
  limit 1;

  if v_request_key is not null then
    perform public.release_transcript_quota(v_request_key);
  end if;

  return v_row;
end;
$$;

-- Drop reservations that no longer map to a live transcript (failed create, etc.).
create or replace function public.release_orphaned_quota(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_released integer := 0;
begin
  if p_user_id is null then
    raise exception 'user_id is required';
  end if;

  if auth.uid() is not null
    and auth.uid() <> p_user_id
    and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  for v_key in
    select q.request_key
    from public.quota_reservations q
    where q.user_id = p_user_id
      and (
        -- Soft-deleted / gone transcript still holding a reservation.
        (
          exists (
            select 1
            from public.transcription_jobs j
            join public.transcripts t on t.id = j.transcript_id
            where j.request_key = q.request_key
              and t.deleted_at is not null
          )
          and not exists (
            select 1
            from public.transcription_jobs j
            join public.transcripts t on t.id = j.transcript_id
            where j.request_key = q.request_key
              and t.deleted_at is null
          )
        )
        -- Failed create: reserved but never wrote a job (grace for in-flight POSTs).
        or (
          not exists (
            select 1
            from public.transcription_jobs j
            where j.request_key = q.request_key
          )
          and q.created_at < timezone('utc', now()) - interval '2 minutes'
        )
      )
  loop
    perform public.release_transcript_quota(v_key);
    v_released := v_released + 1;
  end loop;

  return v_released;
end;
$$;

revoke all on function public.release_orphaned_quota(uuid) from public;
grant execute on function public.release_orphaned_quota(uuid) to authenticated, service_role;
