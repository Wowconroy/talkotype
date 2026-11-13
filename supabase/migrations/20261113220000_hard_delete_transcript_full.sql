-- Harden user delete: clear circular active_job_id, wipe all child rows,
-- then remove the transcript. R2 object cleanup stays in the API.
-- daily_usage / quota_reservations intentionally kept (attempts stay consumed).
-- usage_events.transcript_id becomes null via ON DELETE SET NULL.

create or replace function public.hard_delete_transcript(p_transcript_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_user uuid;
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  select t.id, t.user_id
    into v_id, v_user
  from public.transcripts t
  where t.id = p_transcript_id
    and (
      coalesce(auth.role(), '') = 'service_role'
      or t.user_id = auth.uid()
    );

  if v_id is null then
    return null;
  end if;

  -- Break transcripts.active_job_id ↔ transcription_jobs cycle before cascade.
  update public.transcripts
     set active_job_id = null
   where id = v_id;

  delete from public.transcription_chunks where transcript_id = v_id;
  delete from public.transcription_jobs where transcript_id = v_id;
  delete from public.transcript_segments where transcript_id = v_id;
  delete from public.transcript_speakers where transcript_id = v_id;
  delete from public.media_assets where transcript_id = v_id;

  delete from public.transcripts where id = v_id;

  return v_id;
end;
$$;

revoke all on function public.hard_delete_transcript(uuid) from public;
grant execute on function public.hard_delete_transcript(uuid) to authenticated, service_role;

comment on function public.hard_delete_transcript(uuid) is
  'Hard-deletes a transcript and all related DB rows (jobs, chunks, segments, speakers, media). Storage wipe is done by the API.';
