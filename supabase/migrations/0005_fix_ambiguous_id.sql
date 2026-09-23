-- ============================================================
-- 0005: Fix ambiguous "id" column in admin list RPCs
--
-- admin_list_wedding_events and admin_list_registry_items both
-- `returns table(id uuid, ...)` and contain
--   select id into v_inv_id from public.invitations where slug = p_slug;
-- The bare `id` is ambiguous between invitations.id and the function's
-- own output column variable, raising 42702 at call time. Qualify it.
-- ============================================================

create or replace function public.admin_list_wedding_events(p_passcode text, p_slug text)
returns table (
  id uuid,
  title text,
  description text,
  event_date date,
  event_time time,
  timezone text,
  venue_name text,
  venue_address text,
  map_url text,
  dress_code text,
  sort_order int
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv_id uuid;
begin
  perform public.admin_check(p_passcode);

  select i.id into v_inv_id from public.invitations i where i.slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  return query
    select e.id, e.title, e.description, e.event_date, e.event_time,
           e.timezone, e.venue_name, e.venue_address, e.map_url,
           e.dress_code, e.sort_order
    from public.wedding_events e
    where e.invitation_id = v_inv_id
    order by e.sort_order, e.event_date, e.created_at;
end;
$$;

create or replace function public.admin_list_registry_items(p_passcode text, p_slug text)
returns table (
  id uuid,
  title text,
  description text,
  url text,
  button_label text,
  image_url text,
  sort_order int
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv_id uuid;
begin
  perform public.admin_check(p_passcode);

  select i.id into v_inv_id from public.invitations i where i.slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  return query
    select r.id, r.title, r.description, r.url, r.button_label,
           r.image_url, r.sort_order
    from public.registry_items r
    where r.invitation_id = v_inv_id
    order by r.sort_order, r.created_at;
end;
$$;

-- Same ambiguous-id pattern exists in admin_save_wedding_event and
-- admin_save_registry_item (they return jsonb, so no output-column
-- conflict, but qualify for safety and consistency).
create or replace function public.admin_save_wedding_event(
  p_passcode text,
  p_slug text,
  p_event_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv_id uuid;
  v_title text;
  v_description text;
  v_event_date date;
  v_event_time time;
  v_timezone text;
  v_venue_name text;
  v_venue_address text;
  v_map_url text;
  v_dress_code text;
  v_sort_order int;
  v_existing uuid;
begin
  perform public.admin_check(p_passcode);

  select i.id into v_inv_id from public.invitations i where i.slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  v_title        := left(coalesce(p_payload->>'title', ''), 200);
  v_description  := left(coalesce(p_payload->>'description', ''), 1000);
  v_event_date   := nullif(p_payload->>'event_date', '')::date;
  v_event_time   := nullif(p_payload->>'event_time', '')::time;
  v_timezone     := coalesce(nullif(p_payload->>'timezone', ''), 'Asia/Karachi');
  v_venue_name   := left(coalesce(p_payload->>'venue_name', ''), 200);
  v_venue_address := left(coalesce(p_payload->>'venue_address', ''), 300);
  v_map_url      := left(coalesce(p_payload->>'map_url', ''), 500);
  v_dress_code   := left(coalesce(p_payload->>'dress_code', ''), 100);
  v_sort_order   := coalesce((p_payload->>'sort_order')::int, 0);

  if v_title = '' then
    raise exception 'TITLE_REQUIRED';
  end if;

  if p_event_id is not null then
    select e.id into v_existing from public.wedding_events e
    where e.id = p_event_id and e.invitation_id = v_inv_id;
  end if;

  if v_existing is not null then
    update public.wedding_events set
      title = v_title,
      description = v_description,
      event_date = v_event_date,
      event_time = v_event_time,
      timezone = v_timezone,
      venue_name = v_venue_name,
      venue_address = v_venue_address,
      map_url = v_map_url,
      dress_code = v_dress_code,
      sort_order = v_sort_order
    where id = p_event_id;
  else
    insert into public.wedding_events (
      invitation_id, title, description, event_date, event_time, timezone,
      venue_name, venue_address, map_url, dress_code, sort_order
    ) values (
      v_inv_id, v_title, v_description, v_event_date, v_event_time, v_timezone,
      v_venue_name, v_venue_address, v_map_url, v_dress_code, v_sort_order
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_save_registry_item(
  p_passcode text,
  p_slug text,
  p_item_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv_id uuid;
  v_title text;
  v_description text;
  v_url text;
  v_button_label text;
  v_image_url text;
  v_sort_order int;
  v_existing uuid;
begin
  perform public.admin_check(p_passcode);

  select i.id into v_inv_id from public.invitations i where i.slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  v_title        := left(coalesce(p_payload->>'title', ''), 200);
  v_description  := left(coalesce(p_payload->>'description', ''), 1000);
  v_url          := left(coalesce(p_payload->>'url', ''), 500);
  v_button_label := left(coalesce(p_payload->>'button_label', 'View registry'), 50);
  v_image_url    := left(coalesce(p_payload->>'image_url', ''), 500);
  v_sort_order   := coalesce((p_payload->>'sort_order')::int, 0);

  if v_title = '' then
    raise exception 'TITLE_REQUIRED';
  end if;
  if v_url = '' then
    raise exception 'URL_REQUIRED';
  end if;

  if p_item_id is not null then
    select r.id into v_existing from public.registry_items r
    where r.id = p_item_id and r.invitation_id = v_inv_id;
  end if;

  if v_existing is not null then
    update public.registry_items set
      title = v_title,
      description = v_description,
      url = v_url,
      button_label = v_button_label,
      image_url = v_image_url,
      sort_order = v_sort_order
    where id = p_item_id;
  else
    insert into public.registry_items (
      invitation_id, title, description, url, button_label, image_url, sort_order
    ) values (
      v_inv_id, v_title, v_description, v_url, v_button_label, v_image_url, v_sort_order
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Re-grant (signatures unchanged)
grant execute on function
  public.admin_list_wedding_events(text, text),
  public.admin_list_registry_items(text, text),
  public.admin_save_wedding_event(text, text, uuid, jsonb),
  public.admin_save_registry_item(text, text, uuid, jsonb)
to anon, authenticated;
