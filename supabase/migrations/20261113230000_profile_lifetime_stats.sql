-- Lifetime library stats that survive hard-delete of transcripts.
alter table public.profiles
  add column if not exists stats_files_total integer not null default 0
    check (stats_files_total >= 0),
  add column if not exists stats_audio_seconds_total integer not null default 0
    check (stats_audio_seconds_total >= 0);

comment on column public.profiles.stats_files_total is
  'Lifetime successful transcriptions ever (not decremented on delete).';
comment on column public.profiles.stats_audio_seconds_total is
  'Lifetime audio seconds transcribed (not decremented on delete).';

-- Backfill from rows that still exist (best effort for history).
update public.profiles p
set
  stats_files_total = greatest(
    p.stats_files_total,
    coalesce((
      select count(*)::integer
      from public.transcripts t
      where t.user_id = p.id
        and t.status = 'ready'
    ), 0)
  ),
  stats_audio_seconds_total = greatest(
    p.stats_audio_seconds_total,
    coalesce((
      select sum(coalesce(t.duration_seconds, 0))::integer
      from public.transcripts t
      where t.user_id = p.id
        and t.status = 'ready'
    ), 0)
  );

-- Bump lifetime counters when a job publishes successfully.
create or replace function public.publish_job_transcript(
  p_job_id uuid,
  p_transcript_text text,
  p_detected_language text default null,
  p_duration_seconds integer default null,
  p_error_code text default null,
  p_mark_failed boolean default false
)
returns public.transcripts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.transcription_jobs;
  v_row public.transcripts;
  v_prev_status public.transcript_status;
  v_prev_duration integer;
  v_new_duration integer;
  v_delta integer;
begin
  if auth.role() <> 'service_role' and auth.uid() is null then
    raise exception 'not allowed';
  end if;

  select * into v_job from public.transcription_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job not found';
  end if;

  select * into v_row from public.transcripts where id = v_job.transcript_id for update;
  if not found then
    raise exception 'transcript not found';
  end if;

  if v_row.active_job_id is distinct from p_job_id then
    raise exception 'job is not the active publisher for this transcript';
  end if;

  if p_mark_failed then
    update public.transcription_jobs
    set status = 'failed',
        error_code = p_error_code,
        finished_at = now(),
        updated_at = now()
    where id = p_job_id;

    update public.transcripts
    set status = 'failed',
        error_message = p_error_code,
        updated_at = now()
    where id = v_row.id
    returning * into v_row;

    return v_row;
  end if;

  v_prev_status := v_row.status;
  v_prev_duration := coalesce(v_row.duration_seconds, 0);

  update public.transcription_jobs
  set status = 'ready',
      error_code = null,
      finished_at = now(),
      updated_at = now()
  where id = p_job_id;

  if v_row.content_revision = v_job.source_content_revision then
    update public.transcripts
    set transcript_text = p_transcript_text,
        detected_language = coalesce(p_detected_language, detected_language),
        duration_seconds = coalesce(p_duration_seconds, duration_seconds),
        status = 'ready',
        error_message = null,
        updated_at = now()
    where id = v_row.id
    returning * into v_row;
  else
    update public.transcripts
    set detected_language = coalesce(p_detected_language, detected_language),
        duration_seconds = coalesce(p_duration_seconds, duration_seconds),
        status = 'ready',
        error_message = null,
        updated_at = now()
    where id = v_row.id
    returning * into v_row;
  end if;

  v_new_duration := coalesce(v_row.duration_seconds, 0);

  if v_prev_status is distinct from 'ready' then
    update public.profiles
    set stats_files_total = stats_files_total + 1,
        stats_audio_seconds_total = stats_audio_seconds_total + v_new_duration,
        updated_at = now()
    where id = v_row.user_id;
  else
    v_delta := v_new_duration - v_prev_duration;
    if v_delta <> 0 then
      update public.profiles
      set stats_audio_seconds_total = greatest(0, stats_audio_seconds_total + v_delta),
          updated_at = now()
      where id = v_row.user_id;
    end if;
  end if;

  return v_row;
end;
$$;

revoke all on function public.publish_job_transcript(uuid, text, text, integer, text, boolean) from public;
grant execute on function public.publish_job_transcript(uuid, text, text, integer, text, boolean) to service_role;
