-- Daily free limit = attempts reserved today, NOT live non-deleted files.
-- Deleting a transcript must not restore quota.

create or replace function public.soft_delete_transcript(p_transcript_id uuid)
returns public.transcripts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.transcripts;
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

  -- Intentionally do NOT release daily quota: free plan is 3 attempts/day.
  return v_row;
end;
$$;

-- Only reclaim quota for abandoned creates (reserved, never wrote a job).
-- Soft-deleted transcripts keep their attempt consumed.
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
      and not exists (
        select 1
        from public.transcription_jobs j
        where j.request_key = q.request_key
      )
      and q.created_at < timezone('utc', now()) - interval '2 minutes'
  loop
    perform public.release_transcript_quota(v_key);
    v_released := v_released + 1;
  end loop;

  return v_released;
end;
$$;
