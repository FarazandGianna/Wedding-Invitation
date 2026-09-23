-- ============================================================
-- 0009: Add gallery page_type + font_style column + admin_update_invitation with font_style
--
-- 1. Alter page_settings check constraint to allow 'gallery'
-- 2. Add gallery page_settings for existing invitations
-- 3. Add font_style column to invitations (admin-editable)
-- 4. Recreate admin_update_invitation with font_style + tagline in whitelist
-- ============================================================

-- 1. Drop old check constraint and add one that includes 'gallery'
alter table public.page_settings drop constraint if exists page_settings_page_type_check;
alter table public.page_settings add constraint page_settings_page_type_check
  check (page_type in ('details', 'venue', 'faq', 'gallery'));

-- 2. Add gallery page_settings for existing invitations
insert into public.page_settings (invitation_id, page_type, button_label, page_title, page_subtitle, is_enabled, sort_order)
select i.id, 'gallery', 'Gallery', 'Gallery', 'A glimpse of our moments together.', true, 3
from public.invitations i
where not exists (
  select 1 from public.page_settings ps
  where ps.invitation_id = i.id and ps.page_type = 'gallery'
);

-- 3. Add font_style column to invitations for admin-editable cursive/serif toggle
alter table public.invitations
  add column if not exists font_style text not null default 'cursive'
  check (font_style in ('cursive', 'serif'));

-- 4. Recreate admin_update_invitation with tagline + font_style in whitelist
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
    'bride_name','groom_name','invitation_title','invitation_message','tagline','font_style',
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
      when 'tagline' then update public.invitations set tagline = nullif(left(v_val, 500), '') where id = v_inv.id;
      when 'font_style' then update public.invitations set font_style = case when v_val = 'serif' then 'serif' else 'cursive' end where id = v_inv.id;
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

grant execute on function public.admin_update_invitation(text, text, jsonb) to anon, authenticated;
