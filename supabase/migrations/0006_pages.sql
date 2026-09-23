-- ============================================================
-- 0006: Multi-page experience — Details, Venue, FAQ pages
--
-- Adds:
--   - tagline column on invitations (admin-editable hero subtitle)
--   - page_settings table (nav button labels, page titles, enable/disable)
--   - page_items table (custom content rows for Details & Venue pages)
--   - faq_items table (Q&A pairs)
-- All with public-read RLS (published invitations only) and
-- passcode-gated admin CRUD RPCs following the 0002 pattern.
-- Also recreates admin_update_invitation to include the new tagline field.
-- ============================================================

-- ============================================================
-- TAGLINE on invitations
-- ============================================================
alter table public.invitations add column if not exists tagline text;

-- ============================================================
-- PAGE SETTINGS — one row per page type per invitation
-- Controls nav button labels, page headings, and visibility.
-- ============================================================
create table if not exists public.page_settings (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  page_type text not null check (page_type in ('details', 'venue', 'faq')),
  button_label text,
  page_title text,
  page_subtitle text,
  is_enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(invitation_id, page_type)
);

create index if not exists idx_page_settings_invitation on public.page_settings(invitation_id);

drop trigger if exists trg_page_settings_updated on public.page_settings;
create trigger trg_page_settings_updated before update on public.page_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- PAGE ITEMS — custom content rows for Details & Venue pages
-- e.g. Smoking: No smoking, Drinking: No drinking, Ceremony: 6 PM
-- ============================================================
create table if not exists public.page_items (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  page_type text not null check (page_type in ('details', 'venue')),
  label text not null,
  value text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_page_items_invitation on public.page_items(invitation_id);

drop trigger if exists trg_page_items_updated on public.page_items;
create trigger trg_page_items_updated before update on public.page_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- FAQ ITEMS — question/answer pairs
-- ============================================================
create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_faq_items_invitation on public.faq_items(invitation_id);

drop trigger if exists trg_faq_items_updated on public.faq_items;
create trigger trg_faq_items_updated before update on public.faq_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — public read for published invitations
-- ============================================================
alter table public.page_settings enable row level security;
alter table public.page_items enable row level security;
alter table public.faq_items enable row level security;

drop policy if exists "public can read page_settings" on public.page_settings;
create policy "public can read page_settings"
  on public.page_settings for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = page_settings.invitation_id and i.is_published = true
    )
  );

drop policy if exists "public can read page_items" on public.page_items;
create policy "public can read page_items"
  on public.page_items for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = page_items.invitation_id and i.is_published = true
    )
  );

drop policy if exists "public can read faq_items" on public.faq_items;
create policy "public can read faq_items"
  on public.faq_items for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = faq_items.invitation_id and i.is_published = true
    )
  );

-- ============================================================
-- SEED: default page_settings rows for existing invitations
-- ============================================================
insert into public.page_settings (invitation_id, page_type, button_label, page_title, page_subtitle, is_enabled, sort_order)
select i.id, s.page_type, s.button_label, s.page_title, s.page_subtitle, true, s.sort_order
from public.invitations i,
  (values
    ('details', 'Details', 'The Details', 'Everything you need to know about the celebration.', 0),
    ('venue', 'Venue', 'Venue', 'Where to find us on the big day.', 1),
    ('faq', 'FAQ', 'Frequently Asked Questions', 'Answers to common questions.', 2)
  ) as s(page_type, button_label, page_title, page_subtitle, sort_order)
where not exists (
  select 1 from public.page_settings ps
  where ps.invitation_id = i.id and ps.page_type = s.page_type
);

-- ============================================================
-- RECREATE admin_update_invitation with tagline added to whitelist
-- (Preserves all behavior from the 0002 version)
-- ============================================================
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
    'tagline',
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
      when 'tagline' then update public.invitations set tagline = left(v_val, 500) where id = v_inv.id;
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

-- ============================================================
-- ADMIN RPCs — PAGE SETTINGS
-- ============================================================

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

  select id into v_inv_id from public.invitations where slug = p_slug;
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

  select id into v_inv_id from public.invitations where slug = p_slug;
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

-- ============================================================
-- ADMIN RPCs — PAGE ITEMS (custom Details/Venue rows)
-- ============================================================

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

  select id into v_inv_id from public.invitations where slug = p_slug;
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

  select id into v_inv_id from public.invitations where slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  v_label := left(coalesce(p_label, ''), 200);
  v_value := left(coalesce(p_value, ''), 1000);

  if v_label = '' then
    raise exception 'LABEL_REQUIRED';
  end if;

  if p_item_id is not null then
    select id into v_existing from public.page_items
    where id = p_item_id and invitation_id = v_inv_id;
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

create or replace function public.admin_delete_page_item(p_passcode text, p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.admin_check(p_passcode);
  delete from public.page_items where id = p_item_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- ADMIN RPCs — FAQ ITEMS
-- ============================================================

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

  select id into v_inv_id from public.invitations where slug = p_slug;
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

  select id into v_inv_id from public.invitations where slug = p_slug;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  v_question := left(coalesce(p_question, ''), 500);
  v_answer := left(coalesce(p_answer, ''), 2000);

  if v_question = '' then
    raise exception 'QUESTION_REQUIRED';
  end if;

  if p_item_id is not null then
    select id into v_existing from public.faq_items
    where id = p_item_id and invitation_id = v_inv_id;
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

create or replace function public.admin_delete_faq_item(p_passcode text, p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.admin_check(p_passcode);
  delete from public.faq_items where id = p_item_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- GRANTS
-- ============================================================
grant execute on function
  public.admin_update_invitation(text, text, jsonb),
  public.admin_list_page_settings(text, text),
  public.admin_save_page_settings(text, text, text, text, text, text, boolean, int),
  public.admin_list_page_items(text, text, text),
  public.admin_save_page_item(text, text, uuid, text, text, text, int),
  public.admin_delete_page_item(text, uuid),
  public.admin_list_faq_items(text, text),
  public.admin_save_faq_item(text, text, uuid, text, text, int),
  public.admin_delete_faq_item(text, uuid)
to anon, authenticated;
