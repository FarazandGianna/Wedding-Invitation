-- Wedding invitation schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ============================================================
-- INVITATIONS
-- ============================================================
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  is_published boolean not null default true,

  bride_name text not null,
  groom_name text not null,
  invitation_title text,
  invitation_message text,

  wedding_date date not null,
  wedding_time time,
  timezone text not null default 'UTC',

  venue_name text,
  venue_address text,
  map_url text,

  contact_name text,
  contact_phone text,

  rsvp_enabled boolean not null default true,
  rsvp_deadline timestamptz,
  max_guests_per_rsvp int not null default 5,

  og_image_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.invitations is 'One row per wedding invitation. Public read of non-sensitive fields only.';

-- ============================================================
-- SECTION SETTINGS (enable/disable sections without code changes)
-- ============================================================
create table if not exists public.invitation_sections (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  section_key text not null, -- hero | couple | message | countdown | details | venue | gallery | rsvp | contact | footer
  is_enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (invitation_id, section_key)
);

-- ============================================================
-- GALLERY
-- ============================================================
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  storage_path text not null, -- path within the 'gallery' storage bucket
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- GUESTS / RSVPS
-- ============================================================
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  full_name text not null,
  phone text,
  attendance_status text not null check (attendance_status in ('attending', 'not_attending')),
  guest_count int check (guest_count is null or guest_count >= 1),
  message text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- basic length guards against abuse (also enforced client-side)
  constraint full_name_len check (char_length(full_name) between 1 and 100),
  constraint phone_len check (phone is null or char_length(phone) <= 30),
  constraint message_len check (message is null or char_length(message) <= 500)
);

-- One RSVP per phone number per invitation (soft duplicate protection).
-- Guests without a phone can still submit; re-submission with the same
-- phone updates the existing row instead of creating a duplicate (see RPC below).
create unique index if not exists rsvps_unique_phone_per_invite
  on public.rsvps (invitation_id, phone)
  where phone is not null and phone <> '';

create index if not exists idx_rsvps_invitation on public.rsvps(invitation_id);
create index if not exists idx_sections_invitation on public.invitation_sections(invitation_id);
create index if not exists idx_gallery_invitation on public.gallery_items(invitation_id);
create index if not exists idx_invitations_slug on public.invitations(slug);

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_invitations_updated on public.invitations;
create trigger trg_invitations_updated before update on public.invitations
  for each row execute function public.set_updated_at();

drop trigger if exists trg_rsvps_updated on public.rsvps;
create trigger trg_rsvps_updated before update on public.rsvps
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.invitations enable row level security;
alter table public.invitation_sections enable row level security;
alter table public.gallery_items enable row level security;
alter table public.rsvps enable row level security;

-- Public can read a published invitation's public-facing fields.
-- (Column-level restriction isn't native to RLS, so the frontend must only
--  select the public columns it needs — see src/hooks/useInvitation.ts.
--  Nothing sensitive, like admin data, lives on this table.)
drop policy if exists "public can read published invitations" on public.invitations;
create policy "public can read published invitations"
  on public.invitations for select
  using (is_published = true);

drop policy if exists "public can read enabled sections" on public.invitation_sections;
create policy "public can read enabled sections"
  on public.invitation_sections for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_sections.invitation_id and i.is_published = true
    )
  );

drop policy if exists "public can read gallery" on public.gallery_items;
create policy "public can read gallery"
  on public.gallery_items for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = gallery_items.invitation_id and i.is_published = true
    )
  );

-- No direct public SELECT/UPDATE/DELETE policy on rsvps: guests must never
-- be able to read each other's submissions. Inserts happen only through the
-- SECURITY DEFINER RPC below, which enforces the RSVP-open/deadline rules
-- server-side (not just in the UI).
drop policy if exists "no direct public select on rsvps" on public.rsvps;

-- ============================================================
-- RSVP SUBMISSION RPC (SECURITY DEFINER)
-- Bypasses the lack of a public INSERT policy so RSVPs can only be created
-- through this validated entry point, never via arbitrary table access.
-- ============================================================
create or replace function public.submit_rsvp(
  p_invitation_slug text,
  p_full_name text,
  p_phone text,
  p_attendance_status text,
  p_guest_count int,
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

  if v_clean_message is not null and char_length(v_clean_message) > 500 then
    v_clean_message := left(v_clean_message, 500);
  end if;

  if v_clean_phone is not null and char_length(v_clean_phone) > 30 then
    raise exception 'INVALID_PHONE';
  end if;

  -- Upsert on (invitation, phone) so a resubmission updates rather than duplicates.
  if v_clean_phone is not null then
    insert into public.rsvps (invitation_id, full_name, phone, attendance_status, guest_count, message)
    values (v_invitation.id, v_clean_name, v_clean_phone, p_attendance_status, p_guest_count, v_clean_message)
    on conflict (invitation_id, phone) where phone is not null and phone <> ''
    do update set
      full_name = excluded.full_name,
      attendance_status = excluded.attendance_status,
      guest_count = excluded.guest_count,
      message = excluded.message,
      updated_at = now()
    returning * into v_row;
  else
    insert into public.rsvps (invitation_id, full_name, phone, attendance_status, guest_count, message)
    values (v_invitation.id, v_clean_name, null, p_attendance_status, p_guest_count, v_clean_message)
    returning * into v_row;
  end if;

  return query select v_row.id, v_row.submitted_at;
end;
$$;

-- Only the anon/authenticated roles may call the RPC; nothing else.
revoke all on function public.submit_rsvp from public;
grant execute on function public.submit_rsvp to anon, authenticated;

-- ============================================================
-- STORAGE (gallery images) — create bucket + public-read policy
-- ============================================================
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "public read gallery bucket" on storage.objects;
create policy "public read gallery bucket"
  on storage.objects for select
  using (bucket_id = 'gallery');

-- ============================================================
-- SEED: one example invitation so the app has something to render.
-- Edit these rows directly in the Supabase table editor to manage content.
-- ============================================================
insert into public.invitations (
  slug, bride_name, groom_name, invitation_title, invitation_message,
  wedding_date, wedding_time, timezone, venue_name, venue_address, map_url,
  rsvp_enabled, rsvp_deadline, max_guests_per_rsvp
) values (
  'sample-wedding', 'Gianna', 'Firas',
  'Together with our families',
  'We are getting married and would love for you to join us as we celebrate the beginning of our new life together.',
  (current_date + interval '90 days')::date, '18:00', 'Asia/Riyadh',
  'The Garden Hall', '123 Celebration Ave, Jeddah', 'https://maps.google.com/?q=Jeddah',
  true, (now() + interval '75 days'), 5
)
on conflict (slug) do nothing;

insert into public.invitation_sections (invitation_id, section_key, is_enabled, sort_order)
select i.id, s.key, true, s.ord
from public.invitations i,
  (values ('hero',1),('couple',2),('message',3),('countdown',4),('details',5),
          ('venue',6),('gallery',7),('rsvp',8),('contact',9),('footer',10)) as s(key, ord)
where i.slug = 'sample-wedding'
on conflict (invitation_id, section_key) do nothing;
