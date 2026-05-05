import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const { Pool } = pg;
const app = express();
const PORT = 3001;

// Replit PostgreSQL — orders table
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Supabase Admin client (service role — server only)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  }
);

app.use(cors());
app.use(express.json());

// ─── Helper: verify Supabase JWT ────────────────────────────────────────────
async function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function requireAdmin(req, res, next) {
  const user = await verifyToken(req);
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { data } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (!data || data.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden: Admin only' });
  req.user = user;
  next();
}

async function requireAuth(req, res, next) {
  const user = await verifyToken(req);
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  req.user = user;
  next();
}

// ─── Auth / Profile ──────────────────────────────────────────────────────────

// POST /api/auth/create-profile — called after sign-up
app.post('/api/auth/create-profile', async (req, res) => {
  try {
    const { user_id, full_name } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: 'user_id required' });

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: user_id, full_name: full_name || '', role: 'user' }, { onConflict: 'id' });

    if (error) throw error;
    res.json({ success: true, role: 'user' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me — get own profile + role (requires auth)
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data: { ...data, email: req.user.email, id: req.user.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users — list all users with roles (admin only)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get emails from auth.users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailMap = {};
    authUsers?.users?.forEach(u => { emailMap[u.id] = u.email; });

    const users = data.map(p => ({ ...p, email: emailMap[p.id] || '' }));
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/users/:id/role — update user role (admin only)
app.post('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role tidak valid' });
    }
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: `Role berhasil diupdate ke ${role}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Orders ──────────────────────────────────────────────────────────────────

// GET /api/orders (admin only)
app.get('/api/orders', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const validStatus = ['pending', 'confirmed', 'done'];
    let result;
    if (status && validStatus.includes(status)) {
      result = await pool.query(
        'SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );
    } else {
      result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    }
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders (authenticated)
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { nama, whatsapp, tanggal, lokasi, paket, catatan } = req.body;
    if (!nama || !whatsapp || !tanggal || !lokasi || !paket) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    const validPaket = ['silver', 'gold', 'premium'];
    if (!validPaket.includes(paket.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Paket tidak valid' });
    }
    const result = await pool.query(
      'INSERT INTO orders (nama, whatsapp, tanggal, lokasi, paket, catatan) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [nama, whatsapp, tanggal, lokasi, paket.toLowerCase(), catatan || '']
    );
    res.json({ success: true, message: 'Pesanan berhasil disimpan!', order_id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:id/status (admin only)
app.post('/api/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatus = ['pending', 'confirmed', 'done'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true, message: 'Status berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

// Ensure reviews table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS reviews (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT NOT NULL,
    visible    BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(err => console.error('reviews table init error:', err.message));

// POST /api/reviews — public, submit a review
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    if (!name || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Nama, rating, dan komentar wajib diisi' });
    }
    const r = parseInt(rating);
    if (r < 1 || r > 5) {
      return res.status(400).json({ success: false, message: 'Rating harus antara 1–5' });
    }
    await pool.query(
      'INSERT INTO reviews (name, rating, comment) VALUES ($1, $2, $3)',
      [name.trim(), r, comment.trim()]
    );
    res.json({ success: true, message: 'Ulasan berhasil dikirim! Terima kasih 🙏' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews — public, visible reviews only
app.get('/api/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, rating, comment, created_at FROM reviews WHERE visible = true ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reviews — admin, all reviews
app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/reviews/:id/visible — toggle visible
app.put('/api/admin/reviews/:id/visible', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE reviews SET visible = NOT visible WHERE id = $1 RETURNING visible',
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Ulasan tidak ditemukan' });
    res.json({ success: true, visible: result.rows[0].visible });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/reviews/:id
app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    res.json({ success: true, message: 'Ulasan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Packages ────────────────────────────────────────────────────────────────

// GET /api/packages — public, returns active packages
app.get('/api/packages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM packages WHERE active = true ORDER BY sort_order ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/packages — admin, returns all packages
app.get('/api/admin/packages', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packages ORDER BY sort_order ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/packages — create package (admin only)
app.post('/api/admin/packages', requireAdmin, async (req, res) => {
  try {
    const { key, label, price, price_note, badge, popular, features, wa_msg, cta_class, sort_order, active } = req.body;
    if (!key || !label || !price) {
      return res.status(400).json({ success: false, message: 'key, label, dan price wajib diisi' });
    }
    const result = await pool.query(
      `INSERT INTO packages (key, label, price, price_note, badge, popular, features, wa_msg, cta_class, sort_order, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [key, label, price, price_note || 'per hari acara', badge || '', popular ?? false,
       JSON.stringify(features || []), wa_msg || '', cta_class || 'btn-primary', sort_order ?? 0, active ?? true]
    );
    res.json({ success: true, message: 'Paket berhasil ditambahkan', id: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Key paket sudah digunakan' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/packages/:id — update package (admin only)
app.put('/api/admin/packages/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, price, price_note, badge, popular, features, wa_msg, cta_class, sort_order, active } = req.body;
    await pool.query(
      `UPDATE packages SET label=$1, price=$2, price_note=$3, badge=$4, popular=$5,
       features=$6, wa_msg=$7, cta_class=$8, sort_order=$9, active=$10 WHERE id=$11`,
      [label, price, price_note || 'per hari acara', badge || '', popular ?? false,
       JSON.stringify(features || []), wa_msg || '', cta_class || 'btn-primary', sort_order ?? 0, active ?? true, id]
    );
    res.json({ success: true, message: 'Paket berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/packages/:id — delete package (admin only)
app.delete('/api/admin/packages/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM packages WHERE id = $1', [id]);
    res.json({ success: true, message: 'Paket berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Serve built React app ───────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(`API server running on http://127.0.0.1:${PORT}`);
});
