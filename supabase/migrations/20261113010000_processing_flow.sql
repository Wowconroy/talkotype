-- Additive processing flow: media assets, jobs, chunks, transcript editor safety.
-- Preserves existing tables, signup trigger, and data.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.media_kind as enum ('original', 'extracted_audio', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.job_status as enum (
    'queued',
    'processing',
    'ready',
    'failed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.chunk_status as enum (
    'queued',
    'processing',
    'ready',
    'failed'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- transcripts: editor + language fields (keep as dashboard / TXT source)
-- ---------------------------------------------------------------------------

alter table public.transcripts
  add column if not exists requested_language text,
  add column if not exists detected_language text,
  add column if not exists content_revision integer not null default 0,
  add column if not exists last_edited_at timestamptz,
  add column if not exists active_job_id uuid;

comment on column public.transcripts.transcript_text is
  'Editable transcript body; TXT export reads this. Survives media expiry.';
comment on column public.transcripts.storage_path is
  'Legacy single-object path. Prefer media_assets for new uploads.';
comment on column public.transcripts.active_job_id is
  'Only this job may publish results into transcript_text / status.';
comment on column public.transcripts.content_revision is
  'Incremented on user edits; jobs capture source_content_revision at start.';

-- ---------------------------------------------------------------------------
-- media_assets: private R2 objects with separate retention
-- ---------------------------------------------------------------------------

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.media_kind not null default 'original',
  object_key text not null,
  content_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint media_assets_object_key_unique unique (object_key),
  constraint media_assets_transcript_kind_unique unique (transcript_id, kind)
);

create index if not exists media_assets_user_idx
  on public.media_assets (user_id, created_at desc);
create index if not exists media_assets_expiry_idx
  on public.media_assets (expires_at)
  where expires_at is not null;

-- ---------------------------------------------------------------------------
-- transcription_jobs: processing state separate from editable text
-- ---------------------------------------------------------------------------

create table if not exists public.transcription_jobs (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'assemblyai',
  model text,
  status public.job_status not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  request_key text not null,
  error_code text,
  provider_job_id text,
  source_content_revision integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transcription_jobs_request_key_unique unique (request_key)
);

create index if not exists transcription_jobs_transcript_idx
  on public.transcription_jobs (transcript_id, created_at desc);
create index if not exists transcription_jobs_user_status_idx
  on public.transcription_jobs (user_id, status);

comment on column public.transcription_jobs.request_key is
  'Stable idempotency key. Retries reuse the same key and must not double-count quota.';

-- ---------------------------------------------------------------------------
-- transcription_chunks: long recordings with independent retries
-- ---------------------------------------------------------------------------

create table if not exists public.transcription_chunks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.transcription_jobs (id) on delete cascade,
  transcript_id uuid not null references public.transcripts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  start_ms integer not null default 0 check (start_ms >= 0),
  end_ms integer check (end_ms is null or end_ms >= start_ms),
  status public.chunk_status not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  output_text text,
  output_object_key text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transcription_chunks_job_index_unique unique (job_id, chunk_index)
);

create index if not exists transcription_chunks_job_idx
  on public.transcription_chunks (job_id, chunk_index);

-- Deferred FK from transcripts.active_job_id (table now exists)
do $$ begin
  alter table public.transcripts
    add constraint transcripts_active_job_id_fkey
    foreign key (active_job_id)
    references public.transcription_jobs (id)
    on delete set null;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists transcription_jobs_set_updated_at on public.transcription_jobs;
create trigger transcription_jobs_set_updated_at
before update on public.transcription_jobs
for each row execute function public.set_updated_at();

drop trigger if exists transcription_chunks_set_updated_at on public.transcription_chunks;
create trigger transcription_chunks_set_updated_at
before update on public.transcription_chunks
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Protect editor fields: clients may edit title/text/requested_language only
-- ---------------------------------------------------------------------------

create or replace function public.enforce_transcript_client_updates()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.status := old.status;
    new.error_message := old.error_message;
    new.storage_path := old.storage_path;
    new.active_job_id := old.active_job_id;
    new.duration_seconds := old.duration_seconds;
    new.detected_language := old.detected_language;
    new.source_filename := old.source_filename;
    new.source_mime := old.source_mime;
    new.user_id := old.user_id;

    if new.transcript_text is distinct from old.transcript_text
       or new.title is distinct from old.title
       or new.requested_language is distinct from old.requested_language then
      new.content_revision := old.content_revision + 1;
      new.last_edited_at := now();
    else
      new.content_revision := old.content_revision;
      new.last_edited_at := old.last_edited_at;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists transcripts_enforce_client_updates on public.transcripts;
create trigger transcripts_enforce_client_updates
before update on public.transcripts
for each row execute function public.enforce_transcript_client_updates();

-- ---------------------------------------------------------------------------
-- Idempotent free-tier quota: one request_key => one daily count
-- ---------------------------------------------------------------------------

create table if not exists public.quota_reservations (
  request_key text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  usage_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists quota_reservations_user_day_idx
  on public.quota_reservations (user_id, usage_date);

alter table public.quota_reservations enable row level security;

drop policy if exists "quota_reservations_select_own" on public.quota_reservations;
create policy "quota_reservations_select_own" on public.quota_reservations
  for select using (auth.uid() = user_id);

comment on table public.quota_reservations is
  'Stable request_key ledger. Queue retries reuse the key and never double-count daily_usage.';

create or replace function public.reserve_transcript_quota(
  p_user_id uuid,
  p_request_key text,
  p_daily_limit integer default 3
)
returns table (
  reserved boolean,
  already_reserved boolean,
  transcripts_used integer,
  usage_date date
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

  -- Retry / duplicate delivery: same request_key never consumes quota again
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

  insert into public.daily_usage (user_id, usage_date, transcripts_used)
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
    insert into public.quota_reservations (request_key, user_id, usage_date)
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

-- Publish helper: only active job may write result; never clobber newer edits
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

  update public.transcription_jobs
  set status = 'ready',
      error_code = null,
      finished_at = now(),
      updated_at = now()
  where id = p_job_id;

  -- Preserve user edits made after this job started
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

  return v_row;
end;
$$;

revoke all on function public.publish_job_transcript(uuid, text, text, integer, text, boolean) from public;
grant execute on function public.publish_job_transcript(uuid, text, text, integer, text, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.media_assets enable row level security;
alter table public.transcription_jobs enable row level security;
alter table public.transcription_chunks enable row level security;

-- daily_usage: clients read only (writes via reserve_transcript_quota / service_role)
drop policy if exists "daily_usage_upsert_own" on public.daily_usage;

drop policy if exists "media_assets_select_own" on public.media_assets;
create policy "media_assets_select_own" on public.media_assets
  for select using (auth.uid() = user_id);

drop policy if exists "media_assets_delete_own" on public.media_assets;
create policy "media_assets_delete_own" on public.media_assets
  for delete using (auth.uid() = user_id);

-- Inserts/updates for media + jobs + chunks: service_role only (bypasses RLS)

drop policy if exists "transcription_jobs_select_own" on public.transcription_jobs;
create policy "transcription_jobs_select_own" on public.transcription_jobs
  for select using (auth.uid() = user_id);

drop policy if exists "transcription_chunks_select_own" on public.transcription_chunks;
create policy "transcription_chunks_select_own" on public.transcription_chunks
  for select using (auth.uid() = user_id);
