# Project Report — Wedding Invitation

> **Last updated:** 2026-09-23
> **Repo:** `FarazandGianna/Wedding-Invitation`
> **Live site:** https://farazandgianna.github.io/Wedding-Invitation/
> **Supabase project ref:** `enerawynpulnysufrrah`

---

## What This App Is

A digital wedding invitation for **Faraz & Gianna**, built as a single-page React app deployed to GitHub Pages. Guests open a shareable link, see a sealed envelope animation, and the invitation "opens" into a full wedding website with countdown, venue, gallery, RSVP, itinerary, and registry.

The couple also has a passcode-gated admin page (at `/#/admin`) to manage all content without touching code.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS 3 (custom palette: wine/gold/cream) |
| Routing | React Router v6 in HashRouter mode |
| Backend | Supabase (Postgres + RLS + Storage + RPCs) |
| Deploy | GitHub Pages via Actions (auto-deploys on push to `main`) |
| Fonts | Cormorant Garamond (serif), Cormorant (display), Inter (sans) |

---

## Project Structure

```
src/
  main.tsx                    Entry point, HashRouter
  App.tsx                     Routes: /, /invite/:slug, /admin, *
  index.css                   Global styles, animations, color scheme

  lib/
    supabaseClient.ts         Single Supabase client (publishable key only)

  types/
    invitation.ts             All TypeScript types (Invitation, WeddingEvent, RegistryItem, etc.)

  hooks/
    useInvitation.ts          Data hook: loads invitation + sections + gallery + events + registry
    useCountdown.ts           Timezone-aware countdown timer

  utils/
    format.ts                 Date formatting in invitation's timezone
    time.ts                   Timezone helpers
    meta.ts                   Dynamic SEO meta tags
    validate.ts               RSVP form validation

  components/
    EnvelopeIntro.tsx         4-stage opening animation (sealed → invited text → opening → card → website)
    FgMonogram.tsx            SVG monogram component (renders monogramData)
    monogramData.ts           SVG path/text data for the FG monogram (frame + letters)
    Hero.tsx                  Names, date, venue, monogram watermark
    Nav.tsx                   Sticky section nav (scrolls to sections, no hash anchors)
    Countdown.tsx             Live countdown to wedding date
    CoupleMessage.tsx         Couple's personal message
    EventDetails.tsx          When + contact info
    Venue.tsx                 Venue name, address, map link
    Gallery.tsx               Photo gallery from Supabase storage
    RSVPForm.tsx              RSVP form with name, phone, attendance, guests, coming_from, message
    Itinerary.tsx             Timeline of Pakistan events (Mehndi, Barat, Walima, etc.)
    Registry.tsx              Wedding registry links with images
    Footer.tsx                Monogram, names, share button

  pages/
    InvitationPage.tsx        Main page: envelope intro + all sections + itinerary CTA button
    AdminPage.tsx             Passcode-gated admin dashboard (6 tabs)
    NotFound.tsx              404 page

supabase/
  migrations/
    0001_init.sql             Tables: invitations, invitation_sections, gallery_items, rsvps + RLS + submit_rsvp RPC + storage bucket + seed
    0002_admin.sql            Admin passcode (bcrypt), admin_settings, admin RPCs (verify, list_rsvps, update_invitation, update_section, gallery CRUD, delete_rsvp, summary)
    0003_events_registry.sql  wedding_events + registry_items tables, RLS, admin CRUD RPCs, coming_from column on rsvps, updated submit_rsvp (7 params) + admin_list_rsvps

scripts/
  api-tests.mjs               Runtime API tests against live Supabase (8 tests, all passing)

tools/
  make-monogram.mjs           Original monogram generator (uses font outlines)
```

---

## Database Schema

### Tables

| Table | Purpose | Public Read |
|-------|---------|-------------|
| `invitations` | Wedding details (names, date, venue, RSVP settings) | Published only |
| `invitation_sections` | Enable/disable sections per invitation | Published only |
| `gallery_items` | Photos (storage path or direct URL) | Published only |
| `rsvps` | Guest RSVP submissions (name, phone, attendance, guests, coming_from, message) | No public read (privacy) |
| `wedding_events` | Itinerary events (Mehndi, Barat, Walima) — title, date, time, venue, dress code | Published only |
| `registry_items` | Registry links — title, URL, button label, image | Published only |
| `admin_settings` | Passcode hash (bcrypt) + lockout counter | No public access at all |

### Section Keys

`hero`, `couple`, `message`, `countdown`, `details`, `venue`, `gallery`, `itinerary`, `rsvp`, `registry`, `contact`, `footer`

### Key RPCs

| RPC | Purpose |
|-----|---------|
| `submit_rsvp(slug, name, phone, status, guests, coming_from, message)` | Guest RSVP submission (upserts on phone) |
| `admin_verify(passcode)` | Login check (bcrypt + 15-min lockout after 8 fails) |
| `admin_list_rsvps(passcode, slug)` | Guest list for admin |
| `admin_summary(passcode, slug)` | Attendance counts |
| `admin_update_invitation(passcode, slug, jsonb)` | Edit wedding details |
| `admin_update_section(passcode, slug, key, enabled)` | Toggle sections |
| `admin_add_gallery_item / admin_delete_gallery_item` | Gallery CRUD |
| `admin_delete_rsvp(passcode, id)` | Remove RSVP |
| `admin_list_wedding_events / admin_save_wedding_event / admin_delete_wedding_event` | Events CRUD |
| `admin_list_registry_items / admin_save_registry_item / admin_delete_registry_item` | Registry CRUD |

---

## Admin Page

Accessible at `https://farazandgianna.github.io/Wedding-Invitation/#/admin`

**Tabs:**
1. **Guest list** — RSVP table with stats, CSV export, delete
2. **Details** — Edit names, date, time, venue, contact, RSVP settings
3. **Sections** — Toggle visibility of each section (all 12 keys shown, defaults to enabled)
4. **Gallery** — Add/remove photos by URL
5. **Events** — Full CRUD for itinerary events (Mehndi, Barat, Walima, etc.)
6. **Registry** — Full CRUD for registry links

**Auth:** Single passcode stored as bcrypt hash in `admin_settings`. 15-minute lockout after 8 failed attempts. Passcode cached in `sessionStorage` for the session.

---

## What's Been Done (This Session)

### Deployed Features
- [x] Core invitation page with envelope intro, hero, countdown, details, venue, gallery, RSVP, footer
- [x] Passcode-gated admin page with 6 tabs
- [x] Hash routing (works on GitHub Pages without rewrite rules)
- [x] RLS on all tables (public read for published invitations only, RSVPs private)
- [x] Submit RSVP RPC with server-side validation and upsert on phone
- [x] FG monogram (SVG with ornate Baroque cartouche frame + Cormorant Garamond text initials)
- [x] 4-stage envelope animation (sealed → "You are cordially invited" → opening → card → website)
- [x] Ornate corner flourishes on the invitation card
- [x] "You are cordially invited" text below the envelope with flanking decorative flourishes

### Added This Session
- [x] **Itinerary section** — `wedding_events` table, `Itinerary.tsx` component (timeline with dots, map links, dress code), "View Pakistan Itinerary" CTA button on the invitation page
- [x] **Registry section** — `registry_items` table, `Registry.tsx` component (cards with image, link button)
- [x] **Admin Events tab** — Full CRUD: add/edit/delete events with title, description, date, time, venue, map, dress code, sort order
- [x] **Admin Registry tab** — Full CRUD: add/edit/delete registry items with title, URL, button label, image
- [x] **SectionsTab fix** — Now renders all 12 known section keys (not just DB rows), so new sections appear in admin toggles without manual inserts
- [x] **RSVP "coming from" field** — Optional text field "Where are you coming from?" with helper text "It would help us a lot to know where you're travelling from." Stored in `coming_from` column, shown in admin guest list table and CSV export
- [x] **Migration 0003 applied** — Tables, RLS, RPCs, coming_from column all live in Supabase
- [x] **All 8 API tests passing** against live Supabase

### Migration Status
- [x] 0001_init.sql — Applied (original)
- [x] 0002_admin.sql — Applied (original)
- [x] 0003_events_registry.sql — Applied this session

---

## Known Issues & Next Steps

### Envelope Animation (IN PROGRESS)
The envelope intro was rewritten this session to match the reference storyboard but the user reports it still doesn't look right. Key issues to fix:

1. **Card sitting in envelope** — The card (portrait, 155% height, 72% width) needs to visually sit inside the horizontal envelope properly. Currently the card positioning (`bottom: 4%`, `translateY: 30%` sealed / `8%` card) may not clip correctly. The reference shows the card fully hidden when sealed, peeking out when the flap opens, then fully revealed.

2. **Monogram rendering** — The monogram was switched from hand-crafted SVG paths (broken) to SVG `<text>` elements using Cormorant Garamond. This should render the F and G letters correctly but may need visual verification. The frame is an ornate oval cartouche with Baroque flourishes. The user wants it to match the reference image (`wewe.png` style — ornate Rococo filigree with intertwined serif initials in gold on burgundy).

3. **"You are cordially invited" text** — Now positioned BELOW the envelope (not on it) with flanking decorative SVG flourishes, matching the reference. User confirmed this is the desired placement.

4. **Envelope shape** — Horizontal, ~1.6:1 aspect ratio, V-shaped flap pointing down when closed, flap rotates up when opened. Gold monogram seal sits on the flap tip.

### Content Not Yet Added
- [ ] **Itinerary events** — The `wedding_events` table is empty. The couple needs to add events (Mehndi, Barat, Walima, etc.) via the admin page. Until events exist, the itinerary section and CTA button won't show.
- [ ] **Registry items** — The `registry_items` table is empty. The couple needs to add registry links via the admin page. Until items exist, the registry section won't show.
- [ ] **Gallery photos** — The gallery is empty. Photos can be added via the admin gallery tab (by URL) or uploaded to the Supabase `gallery` storage bucket.

### Google Slides / Sales Deck
The user initially asked about creating a Google Slides deck. Google Slides connector was initiated but may not have been fully authenticated. This task is separate from the wedding app.

---

## Environment Variables

### `.env.production` (committed, public by design)
```
VITE_SUPABASE_URL=https://enerawynpulnysufrrah.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_DZ-KMIcNh4QveEmjLjvBQQ_AO3qXovJ
```
These are publishable values — the database is protected by RLS, not by keeping these secret.

### `.env.local` (gitignored, for local dev/testing)
Optional keys for testing:
- `ADMIN_PASSCODE` — enables admin RPC tests
- `SUPABASE_SERVICE_ROLE_KEY` — enables test cleanup
- `TEST_INVITE_SLUG` — defaults to `sample-wedding`

### Supabase Access Token
A Supabase access token (`sbp_...`) was provided by the user for pushing SQL migrations via the Management API. **Do not commit this to any file.** Use it only as an environment variable for CLI/API calls.

---

## How to Run Locally

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev        # http://localhost:5173
npm test           # API tests against live Supabase
npm run build      # Production build to dist/
```

## How to Deploy

Push to `main` — GitHub Actions auto-builds and deploys to Pages. No manual steps needed.

## How to Apply Migrations

```bash
curl -X POST "https://api.supabase.com/v1/projects/enerawynpulnysufrrah/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "<SQL>"}'
```

---

## Key Design Decisions

1. **HashRouter** — GitHub Pages has no rewrite rules, so path-based deep links 404. Hash routing (`/#/invite/slug`) always works on any static host.

2. **RLS over API keys** — The publishable key ships in the app bundle. Security comes from Row Level Security policies on every table, not from hiding the key.

3. **SECURITY DEFINER RPCs** — RSVP submission and all admin functions go through passcode-gated RPCs, not direct table access. Guests cannot read other guests' RSVPs.

4. **Section toggles** — Sections can be enabled/disabled from the admin page without code changes. Missing section rows default to enabled.

5. **Fail-soft on new tables** — The `useInvitation` hook treats errors from `wedding_events` and `registry_items` as empty arrays, so the page works even if a migration hasn't been applied yet.

6. **SessionStorage for envelope** — The envelope intro shows on first visit per tab session. Reloads in the same tab skip it, but closing and reopening the tab shows it again.
