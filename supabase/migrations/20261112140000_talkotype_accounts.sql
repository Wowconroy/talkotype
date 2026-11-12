-- Talkotype account + transcript foundation (new project)

create extension if not exists "pgcrypto";

create type public.plan_tier as enum ('free', 'unlimited');
create type public.billing_interval as enum ('monthly', 'yearly', 'none');
create type public.auth_provider as enum ('email', 'google');
create type public.transcript_status as enum ('queued', 'processing', 'ready', 'failed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  provider public.auth_provider not null default 'email',
  plan public.plan_tier not null default 'free',
  billing_interval public.billing_interval not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  completed_transcripts boolean not null default true,
  free_quota_resets boolean not null default true,
  product_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.daily_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  transcripts_used integer not null default 0 check (transcripts_used >= 0),
  primary key (user_id, usage_date)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'paid',
  period_start date,
  period_end date,
  invoice_url text,
  created_at timestamptz not null default now()
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled transcript',
  source_filename text,
  source_mime text,
  duration_seconds integer,
  status public.transcript_status not null default 'queued',
  storage_path text,
  transcript_text text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transcripts_user_created_idx on public.transcripts (user_id, created_at desc);
create index invoices_user_created_idx on public.invoices (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger transcripts_set_updated_at
before update on public.transcripts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_name public.auth_provider := 'email';
begin
  if coalesce(new.raw_app_meta_data->>'provider', '') = 'google' then
    provider_name := 'google';
  end if;

  insert into public.profiles (id, email, display_name, provider)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'friend'), '@', 1)),
    provider_name
  )
  on conflict (id) do nothing;

  insert into public.notification_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.notification_settings enable row level security;
alter table public.daily_usage enable row level security;
alter table public.invoices enable row level security;
alter table public.transcripts enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "notification_settings_select_own" on public.notification_settings
  for select using (auth.uid() = user_id);
create policy "notification_settings_update_own" on public.notification_settings
  for update using (auth.uid() = user_id);
create policy "notification_settings_insert_own" on public.notification_settings
  for insert with check (auth.uid() = user_id);

create policy "daily_usage_select_own" on public.daily_usage
  for select using (auth.uid() = user_id);
create policy "daily_usage_upsert_own" on public.daily_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "invoices_select_own" on public.invoices
  for select using (auth.uid() = user_id);

create policy "transcripts_select_own" on public.transcripts
  for select using (auth.uid() = user_id);
create policy "transcripts_insert_own" on public.transcripts
  for insert with check (auth.uid() = user_id);
create policy "transcripts_update_own" on public.transcripts
  for update using (auth.uid() = user_id);
create policy "transcripts_delete_own" on public.transcripts
  for delete using (auth.uid() = user_id);
