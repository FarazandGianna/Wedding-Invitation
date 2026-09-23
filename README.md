# Wedding Invitation

A database-driven digital wedding invitation. React + TypeScript + Vite + Tailwind, backed by Supabase.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- Supabase (Postgres + Row Level Security + Storage) via `@supabase/supabase-js`
- React Router in hash mode (`/#/invite/:slug` — supports multiple invitations;
  hash URLs work on every static host with no rewrite rules)

## 1. Set up Supabase

1. Open your Supabase project's SQL editor.
2. Run `supabase/migrations/0001_init.sql`. This creates the tables, RLS
   policies, the `submit_rsvp` RPC, the public `gallery` storage bucket, and
   seeds one example invitation (`sample-wedding`).
3. Edit the `invitations` row (Table Editor → `invitations`) with your real
   details, or insert a new row for your own wedding.
4. To enable/disable a section (gallery, countdown, etc.) without touching
   code, edit the matching row in `invitation_sections`.
5. To add photos, upload images to the `gallery` storage bucket, then add a
   row to `gallery_items` with the `storage_path` (the path inside the
   bucket) and an `invitation_id`.

## 2. Configure environment variables

```
cp .env.example .env
```

Fill in your Supabase project URL and **publishable** (anon) key — never the
service-role key, which must never appear in frontend code.

## 3. Run locally

```
npm install
npm run dev
npm test        # optional: runtime API tests against your live Supabase project
```

Visit `http://localhost:5173/invite/sample-wedding` (or whatever slug you
used).

If you only ever have one invitation and want `/` to open it directly, set
`VITE_DEFAULT_INVITE_SLUG=your-slug` in `.env`.

## 4. Build

```
npm run build
```

Outputs to `dist/`. Deploy `dist/` to any static host (Vercel, Netlify,
Cloudflare Pages, GitHub Pages, etc.). Remember to set the same environment
variables in your host's dashboard — they're baked in at build time.


## 5. Deploy (GitHub Pages with Actions)

This repo ships a workflow at `.github/workflows/deploy.yml`. To use it:

1. Push the repository to GitHub.
2. In the repo: **Settings → Pages → Build and deployment → Source**, choose
   **GitHub Actions**.
3. Push to `main`; the site builds and deploys automatically.

The Supabase URL and publishable key come from `.env.production`, which is
committed — these two values are public by design (they ship in the app
bundle to every visitor) and the database is protected by RLS. Never put
real secrets (service-role keys, access tokens) in that file.

## Security notes

- RLS is enabled on every table. The public can only read a **published**
  invitation's public columns, its enabled sections, and its gallery.
- Guests can never read other guests' RSVP rows — there is no public SELECT
  policy on `rsvps`. Submissions go through the `submit_rsvp` RPC, which
  validates the RSVP-open/deadline rules server-side (not just client-side)
  and upserts on `(invitation_id, phone)` so a resubmission updates rather
  than duplicates.
- The frontend never uses a service-role key.

## Project structure

```
src/
  lib/supabaseClient.ts      single shared Supabase client
  types/invitation.ts        shared TypeScript types
  hooks/useInvitation.ts     data-access hook (invitation + sections + gallery)
  hooks/useCountdown.ts      timezone-aware countdown
  utils/                     validation, formatting, SEO meta
  components/                Hero, Countdown, Venue, Gallery, RSVPForm, etc.
  pages/InvitationPage.tsx   orchestrates loading/error/not-found/ready states
supabase/migrations/0001_init.sql   full schema, RLS, RPC, storage bucket, seed row
```
