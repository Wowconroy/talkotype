-- Whisper as default engine + paid-only speakers + ops gaps
-- (cost tracking, job progress, monthly usage, webhook ledger, search).

-- ---------------------------------------------------------------------------
-- Provider default: Whisper
-- ---------------------------------------------------------------------------

alter table public.transcription_jobs
  alter column provider set default 'whisper';

comment on column public.transcription_jobs.provider is
  'Transcription engine id. Default whisper (e.g. Groq Whisper Large V3 Turbo).';

-- ---------------------------------------------------------------------------
-- Job progress + speaker request flag (Unlimited only at insert time)
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.job_stage as enum (
    'queued',
    'extracting',
    'uploading',
    'transcribing',
    'diarizing',
    'merging',
    'publishing',
    'ready',
    'failed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

alter table public.transcription_jobs
  add column if not exists progress_pct integer not null default 0
    check (progress_pct >= 0 and progress_pct <= 100),
  add column if not exists stage text not null default 'queued',
  add column if not exists speakers_requested boolean not null default false,
  add column if not exists audio_seconds integer
    check (audio_seconds is null or audio_seconds >= 0),
  add column if not exists cost_cents integer
    check (cost_cents is null or cost_cents >= 0);

comment on column public.transcription_jobs.speakers_requested is
  'Speaker diarization. App must set true only for Unlimited plan.';
comment on column public.transcription_jobs.stage is
  'Coarse processing stage for UI progress (queued → … → ready/failed).';

-- ---------------------------------------------------------------------------
-- Speakers + timed segments (paid feature; free users get none)
-- ---------------------------------------------------------------------------

create table if not exists public.transcript_speakers (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  speaker_index integer not null check (speaker_index >= 0),
  label text not null default 'Speaker',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transcript_speakers_unique_index unique (transcript_id, speaker_index)
);

create index if not exists transcript_speakers_user_idx
  on public.transcript_speakers (user_id, transcript_id);

create table if not exists public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid references public.transcription_jobs (id) on delete set null,
  speaker_id uuid references public.transcript_speakers (id) on delete set null,
  segment_index integer not null check (segment_index >= 0),
  start_ms integer not null default 0 check (start_ms >= 0),
  end_ms integer check (end_ms is null or end_ms >= start_ms),
  text text not null default '',
  created_at timestamptz not null default now(),
  constraint transcript_segments_unique_index unique (transcript_id, segment_index)
);

create index if not exists transcript_segments_transcript_idx
  on public.transcript_segments (transcript_id, segment_index);
create index if not exists transcript_segments_speaker_idx
  on public.transcript_segments (speaker_id)
  where speaker_id is not null;

drop trigger if exists transcript_speakers_set_updated_at on public.transcript_speakers;
create trigger transcript_speakers_set_updated_at
before update on public.transcript_speakers
for each row execute function public.set_updated_at();

alter table public.transcript_speakers enable row level security;
alter table public.transcript_segments enable row level security;

drop policy if exists "transcript_speakers_select_own" on public.transcript_speakers;
create policy "transcript_speakers_select_own" on public.transcript_speakers
  for select using (auth.uid() = user_id);

drop policy if exists "transcript_speakers_update_own" on public.transcript_speakers;
create policy "transcript_speakers_update_own" on public.transcript_speakers
  for update using (auth.uid() = user_id);

drop policy if exists "transcript_segments_select_own" on public.transcript_segments;
create policy "transcript_segments_select_own" on public.transcript_segments
  for select using (auth.uid() = user_id);

-- Writes for speakers/segments: service_role (publish path). Owners may rename labels.

comment on table public.transcript_speakers is
  'Diarized speakers. Populated only when job.speakers_requested (Unlimited).';
comment on table public.transcript_segments is
  'Timed transcript segments optionally linked to speakers.';

-- Guard: only Unlimited profiles may request speakers on a job
create or replace function public.enforce_speakers_requested_plan()
returns trigger
language plpgsql
as $$
declare
  v_plan public.plan_tier;
begin
  if new.speakers_requested is true then
    select p.plan into v_plan from public.profiles p where p.id = new.user_id;
    if v_plan is distinct from 'unlimited' then
      raise exception 'speaker labels require unlimited plan';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists transcription_jobs_enforce_speakers_plan on public.transcription_jobs;
create trigger transcription_jobs_enforce_speakers_plan
before insert or update of speakers_requested on public.transcription_jobs
for each row execute function public.enforce_speakers_requested_plan();

-- ---------------------------------------------------------------------------
-- Usage / cost events (acceptance: track usage and transcription costs)
-- ---------------------------------------------------------------------------

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid references public.transcription_jobs (id) on delete set null,
  transcript_id uuid references public.transcripts (id) on delete set null,
  kind text not null default 'transcription'
    check (kind in ('transcription', 'diarization', 'export', 'other')),
  provider text,
  model text,
  audio_seconds integer not null default 0 check (audio_seconds >= 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_created_idx
  on public.usage_events (user_id, created_at desc);
create index if not exists usage_events_job_idx
  on public.usage_events (job_id)
  where job_id is not null;

alter table public.usage_events enable row level security;

drop policy if exists "usage_events_select_own" on public.usage_events;
create policy "usage_events_select_own" on public.usage_events
  for select using (auth.uid() = user_id);

comment on table public.usage_events is
  'Per-job cost/usage ledger for spend tracking and alerts.';

-- ---------------------------------------------------------------------------
-- Monthly usage (fair-use / Unlimited analytics)
-- ---------------------------------------------------------------------------

create table if not exists public.monthly_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  year_month date not null,
  transcripts_used integer not null default 0 check (transcripts_used >= 0),
  audio_seconds_used integer not null default 0 check (audio_seconds_used >= 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  primary key (user_id, year_month),
  constraint monthly_usage_year_month_first_day check (
    extract(day from year_month) = 1
  )
);

alter table public.monthly_usage enable row level security;

drop policy if exists "monthly_usage_select_own" on public.monthly_usage;
create policy "monthly_usage_select_own" on public.monthly_usage
  for select using (auth.uid() = user_id);

comment on table public.monthly_usage is
  'UTC calendar-month rollup of transcripts, audio seconds, and cost.';

create or replace function public.record_usage_event(
  p_user_id uuid,
  p_job_id uuid,
  p_transcript_id uuid,
  p_kind text default 'transcription',
  p_provider text default null,
  p_model text default null,
  p_audio_seconds integer default 0,
  p_cost_cents integer default 0,
  p_meta jsonb default '{}'::jsonb
)
returns public.usage_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.usage_events;
  v_month date := date_trunc('month', timezone('utc', now()))::date;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  insert into public.usage_events (
    user_id, job_id, transcript_id, kind, provider, model,
    audio_seconds, cost_cents, meta
  )
  values (
    p_user_id, p_job_id, p_transcript_id, coalesce(p_kind, 'transcription'),
    p_provider, p_model, coalesce(p_audio_seconds, 0), coalesce(p_cost_cents, 0),
    coalesce(p_meta, '{}'::jsonb)
  )
  returning * into v_row;

  insert into public.monthly_usage (
    user_id, year_month, transcripts_used, audio_seconds_used, cost_cents
  )
  values (
    p_user_id,
    v_month,
    case when coalesce(p_kind, 'transcription') = 'transcription' then 1 else 0 end,
    coalesce(p_audio_seconds, 0),
    coalesce(p_cost_cents, 0)
  )
  on conflict (user_id, year_month) do update
  set transcripts_used = public.monthly_usage.transcripts_used
        + case when coalesce(p_kind, 'transcription') = 'transcription' then 1 else 0 end,
      audio_seconds_used = public.monthly_usage.audio_seconds_used + coalesce(p_audio_seconds, 0),
      cost_cents = public.monthly_usage.cost_cents + coalesce(p_cost_cents, 0);

  if p_job_id is not null then
    update public.transcription_jobs
    set audio_seconds = coalesce(p_audio_seconds, audio_seconds),
        cost_cents = coalesce(p_cost_cents, cost_cents),
        updated_at = now()
    where id = p_job_id;
  end if;

  return v_row;
end;
$$;

revoke all on function public.record_usage_event(
  uuid, uuid, uuid, text, text, text, integer, integer, jsonb
) from public;
grant execute on function public.record_usage_event(
  uuid, uuid, uuid, text, text, text, integer, integer, jsonb
) to service_role;

-- ---------------------------------------------------------------------------
-- Concurrent active jobs helper (rate limit)
-- ---------------------------------------------------------------------------

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
    and j.status in ('queued', 'processing');
$$;

revoke all on function public.count_active_jobs(uuid) from public;
grant execute on function public.count_active_jobs(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Paddle / billing webhook idempotency ledger
-- ---------------------------------------------------------------------------

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paddle',
  event_id text not null,
  event_type text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  constraint billing_webhook_events_provider_event unique (provider, event_id)
);

create index if not exists billing_webhook_events_processed_idx
  on public.billing_webhook_events (processed_at desc);

alter table public.billing_webhook_events enable row level security;
-- No client policies: service_role only

comment on table public.billing_webhook_events is
  'Idempotent webhook receipt log (Paddle event_id).';

-- ---------------------------------------------------------------------------
-- Transcript search (FTS)
-- ---------------------------------------------------------------------------

alter table public.transcripts
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(source_filename, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(transcript_text, '')), 'C')
  ) stored;

create index if not exists transcripts_search_vector_idx
  on public.transcripts using gin (search_vector);

comment on column public.transcripts.search_vector is
  'Full-text search over title, filename, and transcript body.';
