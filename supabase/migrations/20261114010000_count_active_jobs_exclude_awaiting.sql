-- App writes human-readable errors onto jobs; schema originally only had error_code.
alter table public.transcription_jobs
  add column if not exists error_message text;

-- Stuck link stubs (awaiting_source) must not consume concurrency slots.
create or replace function public.count_active_jobs(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.transcription_jobs j
  where j.user_id = p_user_id
    and j.status in ('queued', 'processing')
    and coalesce(j.stage, '') not in ('awaiting_source', 'failed', 'ready');
$$;

revoke all on function public.count_active_jobs(uuid) from public;
grant execute on function public.count_active_jobs(uuid) to authenticated, service_role;

-- Fail leftover pre-ingest link stubs so Free users are unblocked.
update public.transcription_jobs j
set
  status = 'failed',
  stage = 'failed',
  progress_pct = 100,
  error_code = 'link_ingest_legacy',
  error_message =
    'Link import was queued before ingest shipped. Delete this row or re-import the URL.',
  finished_at = coalesce(j.finished_at, now()),
  updated_at = now()
where j.stage = 'awaiting_source'
  and j.status in ('queued', 'processing');

update public.transcripts t
set
  status = 'failed',
  error_message =
    'Link import was queued before ingest shipped. Delete this row or re-import the URL.',
  updated_at = now()
where t.source_kind = 'link'
  and t.status in ('queued', 'processing')
  and exists (
    select 1
    from public.transcription_jobs j
    where j.id = t.active_job_id
      and j.error_code = 'link_ingest_legacy'
  );
