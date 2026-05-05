# WCC Langkah Baru – Wedding Content Creator

Marketing site untuk layanan Wedding Content Creator di Prabumulih, Sumatera Selatan.

## Stack

- **Frontend**: React 18 + Vite + TypeScript (port 5000)
- **Backend**: Express.js (port 3001, proxied via Vite)
- **Database**: Replit PostgreSQL (`orders` table)
- **Styling**: Global CSS (design tokens, no Tailwind)
- **Routing**: react-router-dom v6

## Struktur Project

```
/
├── api/
│   └── server.js          # Express API (port 3001)
├── src/
│   ├── components/
│   │   ├── CustomCursor.tsx
│   │   ├── Navbar.tsx
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
│   ├── pages/
│   │   ├── Home.tsx        # Landing page (semua sections)
│   │   └── Admin.tsx       # Admin panel (/admin)
│   ├── App.tsx             # BrowserRouter + Routes
│   ├── main.tsx            # React entry point
│   └── index.css           # Global CSS + design tokens
├── index.html              # Vite HTML entry
├── vite.config.ts          # Vite config (port 5000, proxy /api)
├── tsconfig.json
└── package.json
```

## Routes

- `/` → Home (landing page)
- `/admin` → Admin panel (no auth)

## API Endpoints

- `GET /api/orders` — Ambil semua orders (optional `?status=pending|confirmed|done`)
- `POST /api/orders` — Buat order baru
- `POST /api/orders/:id/status` — Update status order

## Database

Table `orders`:
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

## Cara Jalankan

```bash
npm run dev   # Jalankan Vite + Express sekaligus (via concurrently)
```

## WhatsApp

Semua integrasi WA menggunakan nomor: `6281532477237`
