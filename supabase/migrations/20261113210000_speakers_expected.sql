-- Exact speaker count for AssemblyAI diarization (Unlimited "Recognize speakers").

alter table public.transcription_jobs
  add column if not exists speakers_expected integer
    check (
      speakers_expected is null
      or (speakers_expected >= 1 and speakers_expected <= 10)
    );

comment on column public.transcription_jobs.speakers_expected is
  'Exact speaker count passed to AssemblyAI when speakers_requested is true.';
