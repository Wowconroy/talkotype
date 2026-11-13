-- Prefer Google / OAuth display names; keep profiles.display_name user-editable.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_name public.auth_provider := 'email';
  chosen_name text;
begin
  if coalesce(new.raw_app_meta_data->>'provider', '') = 'google' then
    provider_name := 'google';
  end if;

  chosen_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'given_name',
    ''
  )), '');

  if chosen_name is null then
    chosen_name := split_part(coalesce(new.email, 'friend'), '@', 1);
  end if;

  insert into public.profiles (id, email, display_name, provider)
  values (
    new.id,
    coalesce(new.email, ''),
    chosen_name,
    provider_name
  )
  on conflict (id) do nothing;

  insert into public.notification_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

comment on column public.profiles.display_name is
  'Shown in the app. Seeded from Google/OAuth name or email local-part; users can edit anytime.';
