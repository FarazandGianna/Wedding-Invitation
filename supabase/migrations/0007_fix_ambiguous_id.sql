-- ============================================================
-- 0007: Fix ambiguous "id" column in new page/FAQ admin RPCs
--
-- Same issue as 0005: functions that `returns table(id uuid, ...)`
-- contain `select id into v_inv_id from public.invitations where slug = p_slug;`
-- The bare `id` is ambiguous between invitations.id and the function's
-- own output column variable. Qualify it.
-- ============================================================

-- admin_list_page_settings
create or replace function public.admin_list_page_settings(p_passcode text, p_slug text)
returns table (
  id uuid,
  page_type text,
  button_label text,
  page_title text,
  page_subtitle text,
  is_enabled boolean,
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
    select ps.id, ps.page_type, ps.button_label, ps.page_title,
           ps.page_subtitle, ps.is_enabled, ps.sort_order
    from public.page_settings ps
    where ps.invitation_id = v_inv_id
    order by ps.sort_order;
end;
$$;

-- admin_save_page_settings (qualify id in select + upsert conflict)
create or replace function public.admin_save_page_settings(
  p_passcode text,
  p_slug text,
  p_page_type text,
  p_button_label text,
  p_page_title text,
  p_page_subtitle text,
  p_is_enabled boolean,
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

  select i.id into v_inv_id from public.invitations i where i.slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  insert into public.page_settings (
    invitation_id, page_type, button_label, page_title,
    page_subtitle, is_enabled, sort_order
  ) values (
    v_inv_id, p_page_type,
    nullif(left(coalesce(p_button_label, ''), 50), ''),
    nullif(left(coalesce(p_page_title, ''), 200), ''),
    nullif(left(coalesce(p_page_subtitle, ''), 500), ''),
    p_is_enabled,
    coalesce(p_sort_order, 0)
  )
  on conflict (invitation_id, page_type) do update
    set button_label = excluded.button_label,
        page_title = excluded.page_title,
        page_subtitle = excluded.page_subtitle,
        is_enabled = excluded.is_enabled,
        sort_order = excluded.sort_order;

  return jsonb_build_object('ok', true);
end;
$$;

-- admin_list_page_items
create or replace function public.admin_list_page_items(
  p_passcode text,
  p_slug text,
  p_page_type text
)
returns table (
  id uuid,
  page_type text,
  label text,
  value text,
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
    select pi.id, pi.page_type, pi.label, pi.value, pi.sort_order
    from public.page_items pi
    where pi.invitation_id = v_inv_id and pi.page_type = p_page_type
    order by pi.sort_order, pi.created_at;
end;
$$;

-- admin_save_page_item (qualify id in selects)
create or replace function public.admin_save_page_item(
  p_passcode text,
  p_slug text,
  p_item_id uuid,
  p_page_type text,
  p_label text,
  p_value text,
  p_sort_order int
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv_id uuid;
  v_existing uuid;
  v_label text;
  v_value text;
begin
  perform public.admin_check(p_passcode);

  select i.id into v_inv_id from public.invitations i where i.slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  v_label := left(coalesce(p_label, ''), 200);
  v_value := left(coalesce(p_value, ''), 1000);

  if v_label = '' then
    raise exception 'LABEL_REQUIRED';
  end if;

  if p_item_id is not null then
    select pi.id into v_existing from public.page_items pi
    where pi.id = p_item_id and pi.invitation_id = v_inv_id;
  end if;

  if v_existing is not null then
    update public.page_items set
      page_type = p_page_type,
      label = v_label,
      value = v_value,
      sort_order = coalesce(p_sort_order, 0)
    where id = p_item_id;
  else
    insert into public.page_items (invitation_id, page_type, label, value, sort_order)
    values (v_inv_id, p_page_type, v_label, v_value, coalesce(p_sort_order, 0));
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- admin_list_faq_items
create or replace function public.admin_list_faq_items(p_passcode text, p_slug text)
returns table (
  id uuid,
  question text,
  answer text,
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
    select f.id, f.question, f.answer, f.sort_order
    from public.faq_items f
    where f.invitation_id = v_inv_id
    order by f.sort_order, f.created_at;
end;
$$;

-- admin_save_faq_item (qualify id in selects)
create or replace function public.admin_save_faq_item(
  p_passcode text,
  p_slug text,
  p_item_id uuid,
  p_question text,
  p_answer text,
  p_sort_order int
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv_id uuid;
  v_existing uuid;
  v_question text;
  v_answer text;
begin
  perform public.admin_check(p_passcode);

  select i.id into v_inv_id from public.invitations i where i.slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  v_question := left(coalesce(p_question, ''), 500);
  v_answer := left(coalesce(p_answer, ''), 2000);

  if v_question = '' then
    raise exception 'QUESTION_REQUIRED';
  end if;

  if p_item_id is not null then
    select f.id into v_existing from public.faq_items f
    where f.id = p_item_id and f.invitation_id = v_inv_id;
  end if;

  if v_existing is not null then
    update public.faq_items set
      question = v_question,
      answer = v_answer,
      sort_order = coalesce(p_sort_order, 0)
    where id = p_item_id;
  else
    insert into public.faq_items (invitation_id, question, answer, sort_order)
    values (v_inv_id, v_question, v_answer, coalesce(p_sort_order, 0));
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Re-grant (functions were recreated)
grant execute on function
  public.admin_list_page_settings(text, text),
  public.admin_save_page_settings(text, text, text, text, text, text, boolean, int),
  public.admin_list_page_items(text, text, text),
  public.admin_save_page_item(text, text, uuid, text, text, text, int),
  public.admin_list_faq_items(text, text),
  public.admin_save_faq_item(text, text, uuid, text, text, int)
to anon, authenticated;
