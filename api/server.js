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
