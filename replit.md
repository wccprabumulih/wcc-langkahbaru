# WCC Langkah Baru

A marketing and booking website for WCC Langkah Baru, a professional Wedding Content Creator service based in Prabumulih, Sumatera Selatan.

## Architecture

- **Frontend**: Plain HTML/CSS/vanilla JavaScript — no framework or bundler
- **Backend**: PHP 8.2 with PDO (PostgreSQL)
- **Database**: Replit PostgreSQL (converted from MySQL)
- **Server**: PHP built-in server via `server.php` router

## Project Structure

```
/
├── index.html          # Main public landing page with booking form
├── server.php          # PHP built-in server router
├── admin/
│   └── index.html      # Admin panel to view/manage orders
├── PHP/
│   ├── db.php          # PDO connection using PGHOST/PGUSER/etc env vars
│   ├── get_orders.php  # GET: list orders (optionally filter by status)
│   ├── submit_order.php # POST: create new booking order
│   └── update_status.php # POST: update order status
├── php -> PHP/         # Symlink (lowercase alias for frontend fetch calls)
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   └── main.js         # Site behavior + booking form submission
└── assets/             # Static assets (images)
```

## Running the App

The app is served by PHP's built-in server:
```
php -S 0.0.0.0:5000 server.php
```

The workflow "Start application" handles this automatically on port 5000.

## Database

Uses Replit's built-in PostgreSQL. Environment variables set automatically:
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

### Schema

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    tanggal DATE NOT NULL,
    lokasi TEXT NOT NULL,
    paket VARCHAR(50) NOT NULL,   -- 'silver', 'gold', 'premium'
    catatan TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'confirmed', 'done'
    created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

All endpoints are under `/PHP/` (also accessible via `/php/` symlink):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/PHP/get_orders.php` | List all orders (optional `?status=` filter) |
| POST | `/PHP/submit_order.php` | Create a new order |
| POST | `/PHP/update_status.php` | Update an order's status |

## Notes

- The admin panel is at `/admin/` — no authentication is currently configured
- Booking form also sends a WhatsApp deep link message to `wa.me/6281532477237`
- The `php` symlink at project root maps to the `PHP/` directory for case-insensitive frontend fetch compatibility
