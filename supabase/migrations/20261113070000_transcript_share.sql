-- Public share links for transcripts

alter table public.transcripts
  add column if not exists share_token text,
  add column if not exists share_enabled boolean not null default false,
  add column if not exists share_created_at timestamptz;

create unique index if not exists transcripts_share_token_uidx
  on public.transcripts (share_token)
  where share_token is not null;

comment on column public.transcripts.share_token is
  'Opaque public share slug. Null until sharing is enabled once.';
comment on column public.transcripts.share_enabled is
  'When true, /share/[token] is publicly readable.';
