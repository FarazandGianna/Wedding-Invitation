-- ============================================================
-- 0002: Admin area — passcode-gated management RPCs
--
-- Design: the admin page is a public static page, so authorization cannot
-- rely on accounts. A single strong passcode is stored as a cryptompmq
-- bcrypt hash in admin_settings and every admin RPC requires it.
-- Rate limiting: a failed-attempt counter locks verification for 15 minutes
-- after 8 consecutive failures (reset on success). The passcode itself is
-- never stored in plaintext and never returned by any RPC.
-- ============================================================

create table if not exists public.admin_settings (
  id int primary key default 1 check (id = 1),
  passcode_hash text not null,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

-- No policies at all: even SELECT is denied to anon/authenticated. Only the
-- SECURITY DEFINER RPCs below (owner postgres) can touch this table.
drop policy if exists "no direct access to admin_settings" on public.admin_settings;

-- keep updated_at fresh
drop trigger if exists trg_admin_settings_updated on public.admin_settings;
create trigger trg_admin_settings_updated before update on public.admin_settings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- shared helpers
-- ------------------------------------------------------------
create or replace function public.admin_check(p_passcode text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.admin_settings;
begin
  select * into v_row from public.admin_settings where id = 1;

  if not found then
    raise exception 'ADMIN_NOT_CONFIGURED';
  end if;

  if v_row.locked_until is not null and now() < v_row.locked_until then
    raise exception 'ADMIN_LOCKED';
  end if;

  if not (select extensions.crypt(p_passcode, v_row.passcode_hash) = v_row.passcode_hash) then
    -- count consecutive failures; lock after 8
    update public.admin_settings
    set failed_attempts = case when v_row.locked_until is not null then 1 else failed_attempts + 1 end,
        locked_until = case
          when (case when v_row.locked_until is not null then 1 else failed_attempts + 1 end) >= 8
          then now() + interval '15 minutes'
          else locked_until
        end
    where id = 1;
    raise exception 'ADMIN_BAD_PASSCODE';
  end if;

  -- success: reset counter
  update public.admin_settings set failed_attempts = 0, locked_until = null where id = 1;
end;
$$;

-- ------------------------------------------------------------
-- 1) verify passcode (login) — returns nothing; errors mean "no"
-- ------------------------------------------------------------
create or replace function public.admin_verify(p_passcode text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.admin_check(p_passcode);
  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- 2) guest list: all RSVPs for an invitation
-- ------------------------------------------------------------
create or replace function public.admin_list_rsvps(p_passcode text, p_slug text)
returns table (
  id uuid,
  full_name text,
  phone text,
  attendance_status text,
  guest_count int,
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
           r.message, r.submitted_at, r.updated_at
    from public.rsvps r
    join public.invitations i on i.id = r.invitation_id
    where i.slug = p_slug
    order by r.submitted_at desc;
end;
$$;

-- ------------------------------------------------------------
-- 3) update the invitation (all editable fields in one call)
-- ------------------------------------------------------------
create or replace function public.admin_update_invitation(
  p_passcode text,
  p_slug text,
  p_updates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv public.invitations;
  v_allowed text[] := array[
    'bride_name','groom_name','invitation_title','invitation_message',
    'wedding_date','wedding_time','timezone','venue_name','venue_address',
    'map_url','contact_name','contact_phone','rsvp_enabled','rsvp_deadline',
    'max_guests_per_rsvp','og_image_url','is_published'
  ];
  v_key text;
  v_val text;
begin
  perform public.admin_check(p_passcode);

  select * into v_inv from public.invitations where slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  for v_key, v_val in
    select key, value from jsonb_each_text(p_updates)
  loop
    if not (v_key = any(v_allowed)) then
      raise exception 'FIELD_NOT_ALLOWED: %', v_key;
    end if;

    case v_key
      when 'bride_name' then update public.invitations set bride_name = left(v_val, 100) where id = v_inv.id;
      when 'groom_name' then update public.invitations set groom_name = left(v_val, 100) where id = v_inv.id;
      when 'invitation_title' then update public.invitations set invitation_title = left(v_val, 200) where id = v_inv.id;
      when 'invitation_message' then update public.invitations set invitation_message = left(v_val, 1000) where id = v_inv.id;
      when 'wedding_date' then update public.invitations set wedding_date = v_val::date where id = v_inv.id;
      when 'wedding_time' then update public.invitations set wedding_time = nullif(v_val, '')::time where id = v_inv.id;
      when 'timezone' then update public.invitations set timezone = v_val where id = v_inv.id;
      when 'venue_name' then update public.invitations set venue_name = left(v_val, 200) where id = v_inv.id;
      when 'venue_address' then update public.invitations set venue_address = left(v_val, 300) where id = v_inv.id;
      when 'map_url' then update public.invitations set map_url = left(v_val, 500) where id = v_inv.id;
      when 'contact_name' then update public.invitations set contact_name = left(v_val, 100) where id = v_inv.id;
      when 'contact_phone' then update public.invitations set contact_phone = left(v_val, 30) where id = v_inv.id;
      when 'rsvp_enabled' then update public.invitations set rsvp_enabled = v_val::boolean where id = v_inv.id;
      when 'rsvp_deadline' then update public.invitations set rsvp_deadline = nullif(v_val, '')::timestamptz where id = v_inv.id;
      when 'max_guests_per_rsvp' then update public.invitations set max_guests_per_rsvp = greatest(1, least(20, coalesce(v_val::int, 5))) where id = v_inv.id;
      when 'og_image_url' then update public.invitations set og_image_url = left(v_val, 500) where id = v_inv.id;
      when 'is_published' then update public.invitations set is_published = v_val::boolean where id = v_inv.id;
      else raise exception 'FIELD_NOT_ALLOWED: %', v_key;
    end case;
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- 4) section enable/disable + sort order
-- ------------------------------------------------------------
create or replace function public.admin_update_section(
  p_passcode text,
  p_slug text,
  p_section_key text,
  p_is_enabled boolean,
  p_sort_order int default null
)
returns jsonb
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

  update public.invitation_sections
  set is_enabled = p_is_enabled,
      sort_order = coalesce(p_sort_order, sort_order)
  where invitation_id = v_inv_id and section_key = p_section_key;

  if not found then
    insert into public.invitation_sections (invitation_id, section_key, is_enabled, sort_order)
    values (v_inv_id, p_section_key, p_is_enabled, coalesce(p_sort_order, 0))
    on conflict (invitation_id, section_key) do update
      set is_enabled = excluded.is_enabled,
          sort_order = excluded.sort_order;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- 5) gallery: add / remove items (image_url = direct URL managed by admin;
--    storage_path stays for bucket-uploaded photos)
-- ------------------------------------------------------------
alter table public.gallery_items add column if not exists image_url text;

create or replace function public.admin_add_gallery_item(
  p_passcode text,
  p_slug text,
  p_image_url text,
  p_alt_text text default null,
  p_sort_order int default 0
)
returns jsonb
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

  insert into public.gallery_items (invitation_id, storage_path, image_url, alt_text, sort_order)
  values (v_inv_id, 'url-item', left(p_image_url, 500), left(coalesce(p_alt_text, ''), 300), p_sort_order);

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_delete_gallery_item(p_passcode text, p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.admin_check(p_passcode);
  delete from public.gallery_items where id = p_item_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- 6) delete an RSVP (typo submissions etc.)
-- ------------------------------------------------------------
create or replace function public.admin_delete_rsvp(p_passcode text, p_rsvp_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.admin_check(p_passcode);
  delete from public.rsvps where id = p_rsvp_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- 7) summary counts for the dashboard header
-- ------------------------------------------------------------
create or replace function public.admin_summary(p_passcode text, p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv_id uuid;
  v_attending int;
  v_not_attending int;
  v_total_guests int;
  v_pending int;
begin
  perform public.admin_check(p_passcode);

  select id into v_inv_id from public.invitations where slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  select
    count(*) filter (where attendance_status = 'attending'),
    count(*) filter (where attendance_status = 'not_attending'),
    coalesce(sum(guest_count) filter (where attendance_status = 'attending'), 0)
  into v_attending, v_not_attending, v_total_guests
  from public.rsvps where invitation_id = v_inv_id;

  -- rough pending estimate: phone-unique responses vs unknown; we report
  -- submissions only — "pending" needs the real guest list, so we omit it.
  v_pending := 0;

  return jsonb_build_object(
    'attending_parties', v_attending,
    'declined_parties', v_not_attending,
    'total_guests', v_total_guests,
    'rsvp_enabled', (select rsvp_enabled from public.invitations where id = v_inv_id),
    'rsvp_deadline', (select rsvp_deadline from public.invitations where id = v_inv_id)
  );
end;
$$;

-- ------------------------------------------------------------
-- grants: public page calls these as anon
-- ------------------------------------------------------------
grant execute on function
  public.admin_verify(text),
  public.admin_list_rsvps(text, text),
  public.admin_update_invitation(text, text, jsonb),
  public.admin_update_section(text, text, text, boolean, int),
  public.admin_add_gallery_item(text, text, text, text, int),
  public.admin_delete_gallery_item(text, uuid),
  public.admin_delete_rsvp(text, uuid),
  public.admin_summary(text, text)
to anon, authenticated;

revoke all on function public.admin_check(text) from public, anon, authenticated;
