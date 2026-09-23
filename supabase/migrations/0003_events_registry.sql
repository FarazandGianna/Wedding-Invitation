-- ============================================================
-- 0003: Wedding events (itinerary) + registry items
--
-- Two new public-readable tables, each with admin CRUD RPCs that
-- follow the same passcode-gated SECURITY DEFINER pattern as 0002.
-- Public read is RLS-gated to published invitations only.
-- ============================================================

-- ============================================================
-- WEDDING EVENTS (the itinerary: Mehndi, Barat, Walima, etc.)
-- ============================================================
create table if not exists public.wedding_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  title text not null,
  description text,
  event_date date,
  event_time time,
  timezone text not null default 'Asia/Karachi',
  venue_name text,
  venue_address text,
  map_url text,
  dress_code text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_invitation on public.wedding_events(invitation_id);

drop trigger if exists trg_wedding_events_updated on public.wedding_events;
create trigger trg_wedding_events_updated before update on public.wedding_events
  for each row execute function public.set_updated_at();

-- ============================================================
-- REGISTRY ITEMS
-- ============================================================
create table if not exists public.registry_items (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  title text not null,
  description text,
  url text not null,
  button_label text not null default 'View registry',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_registry_invitation on public.registry_items(invitation_id);

drop trigger if exists trg_registry_items_updated on public.registry_items;
create trigger trg_registry_items_updated before update on public.registry_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — public read for published invitations
-- ============================================================
alter table public.wedding_events enable row level security;
alter table public.registry_items enable row level security;

drop policy if exists "public can read events" on public.wedding_events;
create policy "public can read events"
  on public.wedding_events for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = wedding_events.invitation_id and i.is_published = true
    )
  );

drop policy if exists "public can read registry" on public.registry_items;
create policy "public can read registry"
  on public.registry_items for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = registry_items.invitation_id and i.is_published = true
    )
  );

-- ============================================================
-- SEED: add itinerary + registry section toggles for existing invitations
-- ============================================================
insert into public.invitation_sections (invitation_id, section_key, is_enabled, sort_order)
select i.id, s.key, true, s.ord
from public.invitations i,
  (values ('itinerary', 7), ('registry', 9)) as s(key, ord)
where not exists (
  select 1 from public.invitation_sections isec
  where isec.invitation_id = i.id and isec.section_key = s.key
);

-- ============================================================
-- ADMIN RPCs — WEDDING EVENTS
-- ============================================================

-- List all events for an invitation (admin)
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

  select id into v_inv_id from public.invitations where slug = p_slug;
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

-- Add or update a wedding event (upsert by id)
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

  select id into v_inv_id from public.invitations where slug = p_slug;
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

  -- Check if event exists and belongs to this invitation
  if p_event_id is not null then
    select id into v_existing from public.wedding_events
    where id = p_event_id and invitation_id = v_inv_id;
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

-- Delete a wedding event
create or replace function public.admin_delete_wedding_event(p_passcode text, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.admin_check(p_passcode);
  delete from public.wedding_events where id = p_event_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- ADMIN RPCs — REGISTRY ITEMS
-- ============================================================

-- List all registry items for an invitation (admin)
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

  select id into v_inv_id from public.invitations where slug = p_slug;
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

-- Add or update a registry item (upsert by id)
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

  select id into v_inv_id from public.invitations where slug = p_slug;
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
    select id into v_existing from public.registry_items
    where id = p_item_id and invitation_id = v_inv_id;
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

-- Delete a registry item
create or replace function public.admin_delete_registry_item(p_passcode text, p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.admin_check(p_passcode);
  delete from public.registry_items where id = p_item_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- GRANTS
-- ============================================================
grant execute on function
  public.admin_list_wedding_events(text, text),
  public.admin_save_wedding_event(text, text, uuid, jsonb),
  public.admin_delete_wedding_event(text, uuid),
  public.admin_list_registry_items(text, text),
  public.admin_save_registry_item(text, text, uuid, jsonb),
  public.admin_delete_registry_item(text, uuid)
to anon, authenticated;

-- ============================================================
-- RSVP: add optional coming_from column + update submit_rsvp RPC
-- ============================================================
alter table public.rsvps add column if not exists coming_from text;
alter table public.rsvps drop constraint if exists coming_from_len;
alter table public.rsvps add constraint coming_from_len
  check (coming_from is null or char_length(coming_from) <= 200);

-- Drop the old submit_rsvp (6 params) and recreate with coming_from (7 params)
drop function if exists public.submit_rsvp(text, text, text, text, int, text);

create or replace function public.submit_rsvp(
  p_invitation_slug text,
  p_full_name text,
  p_phone text,
  p_attendance_status text,
  p_guest_count int,
  p_coming_from text,
  p_message text
)
returns table (id uuid, submitted_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation record;
  v_clean_name text;
  v_clean_phone text;
  v_clean_coming_from text;
  v_clean_message text;
  v_row public.rsvps;
begin
  select * into v_invitation from public.invitations
    where slug = p_invitation_slug and is_published = true;

  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  if v_invitation.rsvp_enabled is not true then
    raise exception 'RSVP_DISABLED';
  end if;

  if v_invitation.rsvp_deadline is not null and now() > v_invitation.rsvp_deadline then
    raise exception 'RSVP_CLOSED';
  end if;

  v_clean_name := btrim(coalesce(p_full_name, ''));
  v_clean_phone := nullif(btrim(coalesce(p_phone, '')), '');
  v_clean_coming_from := nullif(btrim(coalesce(p_coming_from, '')), '');
  v_clean_message := nullif(btrim(coalesce(p_message, '')), '');

  if v_clean_name = '' or char_length(v_clean_name) > 100 then
    raise exception 'INVALID_NAME';
  end if;

  if p_attendance_status not in ('attending', 'not_attending') then
    raise exception 'INVALID_STATUS';
  end if;

  if p_attendance_status = 'not_attending' then
    p_guest_count := null;
  else
    if p_guest_count is null or p_guest_count < 1 then
      p_guest_count := 1;
    end if;
    if p_guest_count > v_invitation.max_guests_per_rsvp then
      p_guest_count := v_invitation.max_guests_per_rsvp;
    end if;
  end if;

  if v_clean_coming_from is not null and char_length(v_clean_coming_from) > 200 then
    v_clean_coming_from := left(v_clean_coming_from, 200);
  end if;

  if v_clean_message is not null and char_length(v_clean_message) > 500 then
    v_clean_message := left(v_clean_message, 500);
  end if;

  if v_clean_phone is not null and char_length(v_clean_phone) > 30 then
    raise exception 'INVALID_PHONE';
  end if;

  -- Upsert on (invitation, phone) so a resubmission updates rather than duplicates.
  if v_clean_phone is not null then
    insert into public.rsvps (invitation_id, full_name, phone, attendance_status, guest_count, coming_from, message)
    values (v_invitation.id, v_clean_name, v_clean_phone, p_attendance_status, p_guest_count, v_clean_coming_from, v_clean_message)
    on conflict (invitation_id, phone) where phone is not null and phone <> ''
    do update set
      full_name = excluded.full_name,
      attendance_status = excluded.attendance_status,
      guest_count = excluded.guest_count,
      coming_from = excluded.coming_from,
      message = excluded.message,
      updated_at = now()
    returning * into v_row;
  else
    insert into public.rsvps (invitation_id, full_name, phone, attendance_status, guest_count, coming_from, message)
    values (v_invitation.id, v_clean_name, null, p_attendance_status, p_guest_count, v_clean_coming_from, v_clean_message)
    returning * into v_row;
  end if;

  return query select v_row.id, v_row.submitted_at;
end;
$$;

revoke all on function public.submit_rsvp(text, text, text, text, int, text, text) from public;
grant execute on function public.submit_rsvp(text, text, text, text, int, text, text) to anon, authenticated;

-- Update admin_list_rsvps to include coming_from
drop function if exists public.admin_list_rsvps(text, text);
create or replace function public.admin_list_rsvps(p_passcode text, p_slug text)
returns table (
  id uuid,
  full_name text,
  phone text,
  attendance_status text,
  guest_count int,
  coming_from text,
  message text,
  submitted_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.admin_check(p_passcode);
  return query
    select r.id, r.full_name, r.phone, r.attendance_status, r.guest_count,
           r.coming_from, r.message, r.submitted_at, r.updated_at
    from public.rsvps r
    join public.invitations i on i.id = r.invitation_id
    where i.slug = p_slug
    order by r.submitted_at desc;
end;
$$;

grant execute on function public.admin_list_rsvps(text, text) to anon, authenticated;
