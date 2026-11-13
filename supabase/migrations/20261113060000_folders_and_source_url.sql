-- Folders + link-import source fields for desk UI

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists folders_user_created_idx
  on public.folders (user_id, created_at desc);

drop trigger if exists folders_set_updated_at on public.folders;
create trigger folders_set_updated_at
before update on public.folders
for each row execute function public.set_updated_at();

alter table public.folders enable row level security;

drop policy if exists "folders_select_own" on public.folders;
create policy "folders_select_own" on public.folders
  for select using (auth.uid() = user_id);

drop policy if exists "folders_insert_own" on public.folders;
create policy "folders_insert_own" on public.folders
  for insert with check (auth.uid() = user_id);

drop policy if exists "folders_update_own" on public.folders;
create policy "folders_update_own" on public.folders
  for update using (auth.uid() = user_id);

drop policy if exists "folders_delete_own" on public.folders;
create policy "folders_delete_own" on public.folders
  for delete using (auth.uid() = user_id);

do $$ begin
  create type public.transcript_source_kind as enum ('upload', 'link');
exception when duplicate_object then null;
end $$;

alter table public.transcripts
  add column if not exists folder_id uuid references public.folders (id) on delete set null,
  add column if not exists source_url text,
  add column if not exists source_kind public.transcript_source_kind not null default 'upload';

create index if not exists transcripts_user_folder_idx
  on public.transcripts (user_id, folder_id)
  where deleted_at is null;

comment on table public.folders is
  'User-created folders for organizing transcripts on the desk.';
comment on column public.transcripts.source_url is
  'Public media URL for link imports. Ingest pipeline may process later.';
comment on column public.transcripts.source_kind is
  'upload = file via R2; link = imported URL (may be pending ingest).';
