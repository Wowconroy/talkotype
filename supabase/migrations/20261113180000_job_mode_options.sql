-- Persist requested transcription mode and UI options on jobs.

alter table public.transcription_jobs
  add column if not exists requested_mode text not null default 'balanced'
    check (requested_mode in ('fast', 'balanced', 'accurate')),
  add column if not exists filter_fillers boolean not null default false,
  add column if not exists prefer_timestamps boolean not null default true,
  add column if not exists transcribe_to_english boolean not null default false;

comment on column public.transcription_jobs.requested_mode is
  'Product mode: fast=Swift, balanced=Steady, accurate=Deep.';
comment on column public.transcription_jobs.filter_fillers is
  'User asked to filter filler words (applied when processor supports it).';
comment on column public.transcription_jobs.prefer_timestamps is
  'User prefers timed segments in editor/exports when available.';
comment on column public.transcription_jobs.transcribe_to_english is
  'User asked for English output (currently forces Whisper language=en).';
