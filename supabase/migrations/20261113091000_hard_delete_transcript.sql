-- User-initiated delete: remove the row entirely (R2 cleanup happens in the API).
-- daily_usage / quota_reservations are intentionally left alone (attempts stay consumed).

create or replace function public.hard_delete_transcript(p_transcript_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  delete from public.transcripts t
  where t.id = p_transcript_id
    and (
      coalesce(auth.role(), '') = 'service_role'
      or t.user_id = auth.uid()
    )
  returning t.id into v_id;

  if v_id is null then
    raise exception 'transcript not found';
  end if;

  return v_id;
end;
$$;

revoke all on function public.hard_delete_transcript(uuid) from public;
grant execute on function public.hard_delete_transcript(uuid) to authenticated, service_role;
