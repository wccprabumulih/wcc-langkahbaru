# WCC Langkah Baru – Wedding Content Creator

Marketing site untuk layanan Wedding Content Creator di Prabumulih, Sumatera Selatan.

## Stack

- **Frontend**: React 18 + Vite + TypeScript (port 5000)
- **Backend**: Express.js (port 3001, proxied via Vite)
- **Database**: Replit PostgreSQL (`orders` table), Supabase (auth + `profiles` RBAC)
- **Auth**: Supabase Auth (email/password)
- **Styling**: Global CSS (design tokens, no Tailwind)
- **Routing**: react-router-dom v6

## Struktur Project

```
/
├── api/
│   └── server.js              # Express API (port 3001)
├── src/
│   ├── components/
│   │   ├── Navbar.tsx         # Auth-aware navbar, profile dropdown
│   │   ├── ProtectedRoute.tsx # Role-based route guard
│   │   ├── CustomCursor.tsx
│   │   ├── Hero.tsx
│   │   ├── Stats.tsx
│   │   ├── About.tsx
│   │   ├── Services.tsx
│   │   ├── Process.tsx
│   │   ├── Gallery.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Booking.tsx
│   │   ├── Footer.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx    # user, session, role, loading, signOut
│   ├── lib/
│   │   └── supabase.ts        # Supabase client
│   ├── pages/
│   │   ├── Home.tsx           # Landing page (semua sections)
│   │   ├── Auth.tsx           # Login/Register (/auth)
│   │   └── Admin.tsx          # Admin dashboard (/admin, admin-only)
│   ├── App.tsx                # BrowserRouter + Routes
│   ├── main.tsx               # React entry point
│   └── index.css              # Global CSS + design tokens
├── supabase-setup.sql         # SQL untuk dijalankan di Supabase SQL Editor
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Routes

- `/` → Home (landing page)
- `/auth` → Login / Register
- `/admin` → Admin dashboard (protected — role: admin only)

## RBAC System

- Default role untuk semua user baru = `user`
- Role `admin` → redirect ke `/admin` setelah login
- Role `user` → redirect ke `/` setelah login
- `/admin` route dilindungi `ProtectedRoute` (redirect ke `/` jika bukan admin)
- Semua API `/api/orders` dan `/api/admin/*` dilindungi JWT verification

## API Endpoints

### Auth
- `POST /api/auth/create-profile` — Buat profil user (role: user) setelah sign-up
- `GET  /api/auth/me` — Ambil profil + role user yang sedang login (requires auth)

### Admin
- `GET  /api/admin/users` — List semua user dengan role (admin only)
- `POST /api/admin/users/:id/role` — Update role user (admin only)

### Orders
- `GET  /api/orders` — Ambil semua orders (admin only)
- `POST /api/orders` — Buat order baru (requires auth)
- `POST /api/orders/:id/status` — Update status order (admin only)

## Database

### Replit PostgreSQL — `orders` table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  tanggal DATE NOT NULL,
  lokasi TEXT NOT NULL,
  paket VARCHAR(50) NOT NULL,
  catatan TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Supabase — `profiles` table (lihat supabase-setup.sql)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
Trigger `on_auth_user_created` otomatis membuat profil dengan `role='user'` saat user baru daftar.

## Cara Set Admin

1. Login ke Supabase Dashboard → SQL Editor
2. Jalankan `supabase-setup.sql`
3. Update role akun yang ingin dijadikan admin:
```sql
UPDATE public.profiles
  SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'email@kamu.com');
```

## Design Tokens

```css
--bg-deep: #050709          /* Background utama */
--teal: #00d4b8             /* Warna aksen teal */
--gold: #c9a84c             /* Warna gold */
--white: #f0ece4            /* Text utama */
--font-serif: Playfair Display
--font-body: Outfit
--font-italic: Cormorant Garamond
```

## Environment Variables

- `VITE_SUPABASE_URL` — URL project Supabase
- `VITE_SUPABASE_ANON_KEY` — Anon key Supabase (frontend)
- `SUPABASE_SERVICE_KEY` — Service role key (backend only, JANGAN expose ke frontend)
- `SUPABASE_DB_URL` — Supabase DB URL
- `DATABASE_URL` — Replit PostgreSQL (orders table)

## Cara Jalankan

```bash
npm run dev   # Jalankan Vite + Express sekaligus (via concurrently)
```

## WhatsApp

Semua integrasi WA menggunakan nomor: `6281532477237`
