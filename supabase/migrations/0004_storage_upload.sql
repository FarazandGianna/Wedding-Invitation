-- ============================================================
-- 0004: Admin-only photo/video uploads to the gallery bucket
--
-- Uploads are admin-only: the browser asks an Edge Function
-- (functions/v1/upload-gallery-photo) for a signed upload URL;
-- the function validates the admin passcode before minting one
-- with the service role key. The actual file is PUT directly to
-- Supabase Storage via the signed URL, so NO public INSERT policy
-- is needed and there is no Edge Function body-size limit.
-- ============================================================

-- Restrict the gallery bucket to web-displayable images + videos, max 50 MB
-- (videos need more headroom than photos). HEIC/HEIF excluded — not reliably
-- renderable across guest browsers.
update storage.buckets
   set allowed_mime_types = array[
        'image/jpeg','image/png','image/webp','image/gif','image/bmp','image/svg+xml',
        'video/mp4','video/webm','video/quicktime'
       ],
       file_size_limit = 52428800
 where id = 'gallery';

-- Track the media type per gallery item so the public gallery can render
-- <video> for clips and <img> for photos.
alter table public.gallery_items add column if not exists content_type text;
alter table public.gallery_items drop constraint if exists gallery_items_content_type_len;
alter table public.gallery_items add constraint gallery_items_content_type_len
  check (content_type is null or char_length(content_type) <= 100);

-- Admin RPC: record an uploaded photo/video. Stores the real storage_path
-- (for future cleanup) + the public image_url used for display + the
-- content_type so the gallery knows how to render it. Passcode-gated.
create or replace function public.admin_add_uploaded_gallery_item(
  p_passcode text,
  p_slug text,
  p_storage_path text,
  p_image_url text,
  p_alt_text text default null,
  p_content_type text default null,
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

  insert into public.gallery_items (invitation_id, storage_path, image_url, alt_text, content_type, sort_order)
  values (
    v_inv_id,
    left(p_storage_path, 300),
    left(p_image_url, 500),
    left(coalesce(p_alt_text, ''), 300),
    left(coalesce(p_content_type, ''), 100),
    p_sort_order
  );

  return jsonb_build_object('ok', true);
end;
$$;

-- Signature changed (added p_content_type) — refresh grants.
drop function if exists public.admin_add_uploaded_gallery_item(text, text, text, text, text, int);
grant execute on function public.admin_add_uploaded_gallery_item(text, text, text, text, text, text, int)
  to anon, authenticated;
