# WCC Langkah Baru

A marketing and booking platform for a Wedding Content Creator (WCC) service based in Prabumulih, Indonesia.

## Overview

This app provides:
- **Public landing page**: Hero section, About, Service packages, Gallery, Booking form, Testimonials, Footer
- **Authentication**: Login / Register via Supabase Auth (email + password)
- **Admin dashboard**: Manage orders, users, packages, and reviews

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (port 5000)
- **Backend**: Express.js API (port 3001, proxied via `/api`)
- **Auth**: Supabase Auth with RBAC (admin / user roles via `profiles` table in Supabase)
- **Database**: Replit PostgreSQL (`orders`, `packages` tables)
- **Styling**: Custom CSS with Gold/Teal premium theme

## Project Structure

```
/
├── api/
│   └── server.js          # Express API server
├── src/
│   ├── admin/             # Admin panel sub-pages
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminPaket.tsx
│   │   ├── AdminPengguna.tsx
│   │   ├── AdminPesanan.tsx
│   │   ├── AdminPengaturan.tsx
│   │   ├── AdminUlasan.tsx
│   │   └── types.ts
│   ├── components/        # Reusable UI components
│   ├── contexts/
│   │   └── AuthContext.tsx  # Supabase session + role management
│   ├── lib/
│   │   └── supabase.ts    # Supabase client
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Auth.tsx       # Login + Register
│   │   └── Admin.tsx      # Admin layout + routing
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
└── vite.config.ts         # Vite + API proxy config
```

## Database Schema (Replit PostgreSQL)

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | Auto-increment |
| nama | TEXT | Customer name |
| whatsapp | TEXT | Customer WA number |
| tanggal | DATE | Event date |
| lokasi | TEXT | Event location |
| paket | TEXT | silver / gold / premium |
| catatan | TEXT | Optional notes |
| status | TEXT | pending / confirmed / done |
| created_at | TIMESTAMPTZ | Auto |

### `packages`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | Auto-increment |
| key | TEXT UNIQUE | e.g. silver, gold, premium |
| label | TEXT | Display name |
| price | TEXT | e.g. 300K |
| price_note | TEXT | e.g. per hari acara |
| badge | TEXT | Badge label |
| popular | BOOLEAN | Show "Terpopuler" badge |
| features | JSONB | Array of feature strings |
| wa_msg | TEXT | Pre-filled WhatsApp message |
| cta_class | TEXT | btn-primary or btn-outline |
| sort_order | INT | Display order |
| active | BOOLEAN | Show on public site |

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/create-profile | None | Create user profile after sign-up |
| GET | /api/auth/me | User | Get own profile + role |
| GET | /api/orders | Admin | List all orders (with optional ?status filter) |
| POST | /api/orders | User | Submit new booking |
| POST | /api/orders/:id/status | Admin | Update order status |
| GET | /api/packages | None | List active packages (public) |
| GET | /api/admin/packages | Admin | List all packages |
| POST | /api/admin/packages | Admin | Create package |
| PUT | /api/admin/packages/:id | Admin | Update package |
| DELETE | /api/admin/packages/:id | Admin | Delete package |
| GET | /api/admin/users | Admin | List all users with roles |
| POST | /api/admin/users/:id/role | Admin | Update user role |

## Environment Variables / Secrets

All secrets are stored in Replit Secrets:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_KEY` — Supabase service role key (server-only)
- `DATABASE_URL` — Replit PostgreSQL connection string (auto-managed)

## Running the App

```bash
npm run dev
```

Runs both Vite (port 5000) and Express API (port 3001) concurrently via `concurrently`.

## Supabase Setup

The `profiles` table in Supabase stores user roles:
- `id` (references auth.users)
- `full_name` TEXT
- `role` TEXT — `admin` or `user`

See `supabase-setup.sql` for the full schema and trigger setup.
