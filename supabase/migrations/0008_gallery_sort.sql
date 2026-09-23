-- ============================================================
-- 0008: Add admin_update_gallery_sort RPC
-- Allows reordering gallery items (featured = first by sort_order)
-- ============================================================

create or replace function public.admin_update_gallery_sort(
  p_passcode text,
  p_item_id uuid,
  p_sort_order int
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

  select i.id into v_inv_id from public.invitations i
  where i.id = (
    select g.invitation_id from public.gallery_items g where g.id = p_item_id
  );
  if not found then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  update public.gallery_items
    set sort_order = p_sort_order
    where id = p_item_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function
  public.admin_update_gallery_sort(text, uuid, int)
to anon, authenticated;
