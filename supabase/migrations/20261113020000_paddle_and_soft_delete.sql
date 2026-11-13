-- Paddle billing fields + soft deletes for transcripts and media.

alter table public.profiles
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_subscription_id text;

create unique index if not exists profiles_paddle_customer_id_uidx
  on public.profiles (paddle_customer_id)
  where paddle_customer_id is not null;

alter table public.invoices
  add column if not exists paddle_transaction_id text,
  add column if not exists paddle_subscription_id text,
  add column if not exists label text,
  add column if not exists external_id text;

create unique index if not exists invoices_paddle_transaction_id_uidx
  on public.invoices (paddle_transaction_id)
  where paddle_transaction_id is not null;

create unique index if not exists invoices_external_id_uidx
  on public.invoices (external_id)
  where external_id is not null;

alter table public.transcripts
  add column if not exists deleted_at timestamptz;

alter table public.media_assets
  add column if not exists deleted_at timestamptz,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'expired', 'deleted'));

create index if not exists transcripts_user_active_idx
  on public.transcripts (user_id, created_at desc)
  where deleted_at is null;

create index if not exists media_assets_expiry_active_idx
  on public.media_assets (expires_at)
  where deleted_at is null and expires_at is not null;

-- Tighten select policies so soft-deleted rows stay hidden from clients
drop policy if exists "transcripts_select_own" on public.transcripts;
create policy "transcripts_select_own" on public.transcripts
  for select using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "transcripts_update_own" on public.transcripts;
create policy "transcripts_update_own" on public.transcripts
  for update using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "media_assets_select_own" on public.media_assets;
create policy "media_assets_select_own" on public.media_assets
  for select using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "media_assets_delete_own" on public.media_assets;
create policy "media_assets_delete_own" on public.media_assets
  for delete using (auth.uid() = user_id and deleted_at is null);

-- Soft-delete helpers (service or owner via RPC)
create or replace function public.soft_delete_transcript(p_transcript_id uuid)
returns public.transcripts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.transcripts;
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  update public.transcripts t
  set deleted_at = now(),
      updated_at = now()
  where t.id = p_transcript_id
    and t.deleted_at is null
    and (
      coalesce(auth.role(), '') = 'service_role'
      or t.user_id = auth.uid()
    )
  returning * into v_row;

  if not found then
    raise exception 'transcript not found';
  end if;

  update public.media_assets m
  set deleted_at = now(),
      status = 'deleted'
  where m.transcript_id = p_transcript_id
    and m.deleted_at is null;

  return v_row;
end;
$$;

revoke all on function public.soft_delete_transcript(uuid) from public;
grant execute on function public.soft_delete_transcript(uuid) to authenticated, service_role;

comment on column public.profiles.paddle_customer_id is
  'Paddle customer id when billing is connected.';
comment on column public.invoices.paddle_transaction_id is
  'Paddle transaction / payment id for this invoice row.';
