-- Gallery titles: add a display title underneath each photo/video
-- Migration 0010

-- Add title column to gallery_items
alter table public.gallery_items add column if not exists title text;
alter table public.gallery_items drop constraint if exists gallery_items_title_len;
alter table public.gallery_items add constraint gallery_items_title_len
  check (title is null or char_length(title) <= 200);

-- Update admin_add_gallery_item to accept p_title
create or replace function public.admin_add_gallery_item(
  p_passcode text,
  p_slug text,
  p_image_url text,
  p_alt_text text default null,
  p_title text default null,
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

  insert into public.gallery_items (invitation_id, storage_path, image_url, alt_text, title, sort_order)
  values (
    v_inv_id,
    'url-item',
    left(p_image_url, 500),
    left(coalesce(p_alt_text, ''), 300),
    left(coalesce(p_title, ''), 200),
    p_sort_order
  );

  return jsonb_build_object('ok', true);
end;
$$;

-- Drop old signature and re-grant (signature changed: added p_title)
drop function if exists public.admin_add_gallery_item(text, text, text, text, int);
grant execute on function public.admin_add_gallery_item(text, text, text, text, text, int)
  to anon, authenticated;

-- Update admin_add_uploaded_gallery_item to accept p_title
create or replace function public.admin_add_uploaded_gallery_item(
  p_passcode text,
  p_slug text,
  p_storage_path text,
  p_image_url text,
  p_alt_text text default null,
  p_content_type text default null,
  p_title text default null,
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

  insert into public.gallery_items (invitation_id, storage_path, image_url, alt_text, content_type, title, sort_order)
  values (
    v_inv_id,
    left(p_storage_path, 300),
    left(p_image_url, 500),
    left(coalesce(p_alt_text, ''), 300),
    left(coalesce(p_content_type, ''), 100),
    left(coalesce(p_title, ''), 200),
    p_sort_order
  );

  return jsonb_build_object('ok', true);
end;
$$;

-- Drop old signature and re-grant (signature changed: added p_title)
drop function if exists public.admin_add_uploaded_gallery_item(text, text, text, text, text, text, int);
grant execute on function public.admin_add_uploaded_gallery_item(text, text, text, text, text, text, text, int)
  to anon, authenticated;

-- New RPC: update a gallery item's title (for inline editing in admin)
create or replace function public.admin_update_gallery_title(
  p_passcode text,
  p_item_id uuid,
  p_title text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.admin_check(p_passcode);

  update public.gallery_items
    set title = left(coalesce(p_title, ''), 200)
    where id = p_item_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_update_gallery_title(text, uuid, text)
  to anon, authenticated;
