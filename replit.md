# WCC Langkah Baru

A wedding marketing and booking platform for a Wedding Content Creator service based in Prabumulih, Sumatera Selatan, Indonesia.

## Run & Operate

```bash
npm run dev        # starts Vite (port 5000) + Express API (port 3001) concurrently
npm run build      # production build
npm run preview    # preview production build on port 5000
```

Required secrets (all set in Replit Secrets):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (used client-side)
- `SUPABASE_SERVICE_KEY` — Supabase service role key (server-only)
- `SUPABASE_DB_URL` — Supabase PostgreSQL connection string (used by pg Pool)
- `PIO_API_KEY` — Pio.codes AI key for chatbot feature

## Stack

- **Frontend**: React 18 + TypeScript + Vite 5 (port 5000)
- **Backend**: Express.js API (port 3001, proxied via `/api` in Vite dev config)
- **Auth**: Supabase Auth (email + password) with RBAC via `profiles` table
- **Database**: Replit PostgreSQL (orders, packages, reviews, gallery_photos, site_content, site_images, chatbot_knowledge, partners)
- **Storage**: Supabase Storage (gallery + site-images buckets)
- **AI**: Pio.codes chat completions API (chatbot)
- **Styling**: Custom CSS with Gold/Teal premium wedding theme

## Where things live

- `api/server.js` — Express API (all `/api/*` endpoints, DB via pg, auth via Supabase service role)
- `src/` — React frontend
  - `src/lib/supabase.ts` — Supabase client
  - `src/contexts/AuthContext.tsx` — session + role management
  - `src/components/ProtectedRoute.tsx` — admin route guard
  - `src/pages/` — Home, Auth, Admin, Galeri, Ulasan
  - `src/admin/` — all admin sub-pages
- `vite.config.ts` — Vite config (port 5000, `/api` proxy → 3001, `allowedHosts: true`)
- `supabase-setup.sql` — Supabase schema reference (profiles table + trigger)

## Architecture decisions

- **Split auth**: Client uses Supabase anon key for sessions; server uses service role key to verify JWTs and enforce admin RBAC.
- **Dual DB**: Supabase `profiles` table handles user/role data; Replit PostgreSQL handles orders, packages, reviews, and content.
- **Vite proxy**: In dev, all `/api` calls are proxied to Express on 3001 — no CORS issues.
- **Base64 images**: Gallery and site images are sent as base64 from client, uploaded to Supabase Storage server-side, and stored as URLs in the DB.
- **Table auto-init**: Express auto-creates `site_content`, `reviews`, and chatbot tables on startup via `CREATE TABLE IF NOT EXISTS`.

## Product

- Public landing page: hero, about, service packages, gallery, booking form, reviews, chatbot widget
- Booking form: public order submission stored in PostgreSQL
- Auth: email/password login via Supabase, role-based (admin / user)
- Admin dashboard: manage orders (status), users (roles), packages, reviews, gallery, site images, chatbot knowledge base, partners, site content

## User preferences

_Populate as you build_

## Gotchas

- `VITE_` prefix on env vars is required for Vite to expose them to the frontend bundle — do not rename `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_KEY` must never be exposed to the frontend; it is only used in `api/server.js`.
- Vite dev server `allowedHosts: true` is required for Replit's proxied preview iframe to work.
- The `concurrently` package must remain a devDependency — script uses `npx concurrently` to avoid PATH issues.

## Pointers

- Supabase setup: `supabase-setup.sql`
- Replit workflows skill: `.local/skills/workflows/SKILL.md`
- Replit secrets skill: `.local/skills/environment-secrets/SKILL.md`
