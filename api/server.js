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
const PORT = process.env.PORT || 3001;

// Supabase PostgreSQL (transaction pooler)
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
      .upsert({ id: user_id, full_name: full_name || '', role: 'user' }, { onConflict: 'id', ignoreDuplicates: true });

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

// DELETE /api/admin/users/:id — delete user (admin only, cannot delete self)
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
    }
    // Delete from Supabase Auth (cascades to profiles via trigger)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    // Also remove from profiles in case trigger doesn't exist
    await supabaseAdmin.from('profiles').delete().eq('id', id);
    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
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

// POST /api/orders — public, no auth required
app.post('/api/orders', async (req, res) => {
  try {
    const { nama, whatsapp, tanggal, lokasi, paket, catatan } = req.body;
    if (!nama || !whatsapp || !tanggal || !lokasi || !paket) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    const result = await pool.query(
      'INSERT INTO orders (nama, whatsapp, tanggal, lokasi, paket, catatan) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [nama, whatsapp, tanggal, lokasi, paket, catatan || '']
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
    const validStatus = ['pending', 'confirmed', 'done', 'canceled'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true, message: 'Status berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/:id (admin only)
app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    res.json({ success: true, message: 'Pesanan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

// ─── Site Content (About, etc.) ──────────────────────────────────────────────

pool.query(`
  CREATE TABLE IF NOT EXISTS site_content (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(err => console.error('site_content table init error:', err.message));

const DEFAULT_ABOUT = {
  heading: 'Kami Bukan Sekadar',
  heading_highlight: 'Merekam',
  desc1: 'WCC Langkah Baru adalah layanan Wedding Content Creator yang hadir untuk mengabadikan hari istimewamu dengan sentuhan sinematik yang memukau. Setiap frame kami rancang dengan penuh rasa.',
  desc2: 'Dari story Instagram yang captivating hingga reels yang viral-worthy — kami pastikan momen pernikahanmu terdokumentasi dan siap dibagikan ke dunia.',
  instagram: '@wcc.prabumulih',
  availability: 'By Request 🗓️',
  features: [
    { icon: '🎬', title: 'Videografi Sinematik', desc: 'Setiap momen direkam dengan gaya cinematic yang elegan dan berkelas' },
    { icon: '✂️', title: 'Editing Profesional', desc: 'Hasil editing yang halus, estetik, dan siap tayang dalam waktu singkat' },
    { icon: '📲', title: 'Siap Posting', desc: 'Konten langsung bisa di-upload ke Instagram/TikTok' },
    { icon: '☁️', title: 'Video Mentah via Google Drive', desc: 'Semua footage mentah dikirimkan lewat Google Drive untuk koleksi pribadimu' },
  ],
};

// GET /api/content/about — public
app.get('/api/content/about', async (req, res) => {
  try {
    const result = await pool.query('SELECT value FROM site_content WHERE key = $1', ['about']);
    const data = result.rows[0]?.value ?? DEFAULT_ABOUT;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/content/about — admin only
app.put('/api/admin/content/about', requireAdmin, async (req, res) => {
  try {
    const value = req.body;
    await pool.query(
      `INSERT INTO site_content (key, value, updated_at) VALUES ('about', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(value)]
    );
    res.json({ success: true, message: 'Konten berhasil disimpan' });
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
    visible    BOOLEAN NOT NULL DEFAULT true,
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
      'INSERT INTO reviews (name, rating, comment, visible) VALUES ($1, $2, $3, true)',
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

// ─── Storage helpers ─────────────────────────────────────────────────────────

function base64ToBuffer(dataUrl) {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Buffer.from(base64, 'base64');
}

async function uploadToStorage(bucket, path, buffer, contentType = 'image/jpeg') {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return { path: data.path, url: urlData.publicUrl };
}

async function deleteFromStorage(bucket, path) {
  if (!path) return;
  await supabaseAdmin.storage.from(bucket).remove([path]);
}

// ─── Gallery Photos ──────────────────────────────────────────────────────────

// GET /api/gallery — public, paginated
app.get('/api/gallery', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const [rows, countRow] = await Promise.all([
      pool.query(
        'SELECT id, COALESCE(image_url, image_data) AS image_src, created_at FROM gallery_photos ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM gallery_photos'),
    ]);
    res.json({ success: true, data: rows.rows, total: parseInt(countRow.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/gallery — admin, upload one or more photos
app.post('/api/admin/gallery', requireAdmin, async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada foto yang dikirim' });
    }
    const inserted = [];
    for (const base64 of images) {
      const buf = base64ToBuffer(base64);
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const { path, url } = await uploadToStorage('gallery', filename, buf);
      const r = await pool.query(
        'INSERT INTO gallery_photos (image_url, storage_path) VALUES ($1, $2) RETURNING id, created_at',
        [url, path]
      );
      inserted.push(r.rows[0]);
    }
    res.json({ success: true, message: `${inserted.length} foto berhasil diupload`, data: inserted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/gallery/:id — admin, delete a photo
app.delete('/api/admin/gallery/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const row = await pool.query('SELECT storage_path FROM gallery_photos WHERE id = $1', [id]);
    if (row.rows[0]?.storage_path) {
      await deleteFromStorage('gallery', row.rows[0].storage_path);
    }
    await pool.query('DELETE FROM gallery_photos WHERE id = $1', [id]);
    res.json({ success: true, message: 'Foto berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Site Images ─────────────────────────────────────────────────────────────

// GET /api/images — public, returns all uploaded images
app.get('/api/images', async (req, res) => {
  try {
    const result = await pool.query('SELECT slot, COALESCE(image_url, image_data) AS image_data, label FROM site_images');
    const map = {};
    result.rows.forEach(r => { map[r.slot] = { image_data: r.image_data, label: r.label }; });
    res.json({ success: true, data: map });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/images/:slot — admin only, upsert image
app.put('/api/admin/images/:slot', requireAdmin, async (req, res) => {
  try {
    const { slot } = req.params;
    const { image_data, label } = req.body;
    if (!image_data) return res.status(400).json({ success: false, message: 'image_data wajib diisi' });

    // Delete old file from storage if exists
    const existing = await pool.query('SELECT storage_path FROM site_images WHERE slot = $1', [slot]);
    if (existing.rows[0]?.storage_path) {
      await deleteFromStorage('site-images', existing.rows[0].storage_path);
    }

    const buf = base64ToBuffer(image_data);
    const filename = `${slot}_${Date.now()}.jpg`;
    const { path, url } = await uploadToStorage('site-images', filename, buf);

    await pool.query(
      `INSERT INTO site_images (slot, image_url, storage_path, label, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (slot) DO UPDATE SET image_url=$2, storage_path=$3, image_data=NULL, label=$4, updated_at=NOW()`,
      [slot, url, path, label || '']
    );
    res.json({ success: true, message: 'Foto berhasil disimpan', url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/images/:slot — admin only, remove image
app.delete('/api/admin/images/:slot', requireAdmin, async (req, res) => {
  try {
    const { slot } = req.params;
    const existing = await pool.query('SELECT storage_path FROM site_images WHERE slot = $1', [slot]);
    if (existing.rows[0]?.storage_path) {
      await deleteFromStorage('site-images', existing.rows[0].storage_path);
    }
    await pool.query('DELETE FROM site_images WHERE slot = $1', [slot]);
    res.json({ success: true, message: 'Foto berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CHATBOT ─────────────────────────────────────────────────────────────────

// POST /api/chat — public, call Pio.codes AI with knowledge base as context
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ success: false, message: 'Invalid messages' });

    // Fetch all public-safe data in parallel
    const [kb, pkgs, reviews, aboutRow, partners] = await Promise.all([
      pool.query('SELECT category, question, answer FROM chatbot_knowledge WHERE active = TRUE ORDER BY order_index ASC, created_at ASC'),
      pool.query('SELECT label, price, price_note, badge, popular, features FROM packages WHERE active = TRUE ORDER BY sort_order ASC'),
      pool.query('SELECT name, rating, comment FROM reviews WHERE visible = true ORDER BY created_at DESC LIMIT 5'),
      pool.query("SELECT value FROM site_content WHERE key = 'about'"),
      pool.query('SELECT name, category FROM partners WHERE active = TRUE ORDER BY order_index ASC'),
    ]);

    // --- Knowledge base ---
    const knowledgeText = kb.rows.length > 0
      ? '[FAQ & Informasi Umum]\n' + kb.rows.map(r => `[${r.category || 'Umum'}]\nTopik: ${r.question}\nJawaban: ${r.answer}`).join('\n\n')
      : '';

    // --- Packages ---
    let packagesText = '';
    if (pkgs.rows.length > 0) {
      packagesText = '\n\n[Paket Layanan]\n' + pkgs.rows.map(p => {
        const features = Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? JSON.parse(p.features) : []);
        const featureList = features.length > 0 ? '\n  Fitur: ' + features.join(', ') : '';
        const badge = p.badge ? ` (${p.badge})` : '';
        const popular = p.popular ? ' ⭐ TERPOPULER' : '';
        return `Paket ${p.label}${badge}${popular}: ${p.price} ${p.price_note || ''}${featureList}`;
      }).join('\n');
    }

    // --- About / profil bisnis ---
    let aboutText = '';
    if (aboutRow.rows[0]?.value) {
      const a = aboutRow.rows[0].value;
      const feats = Array.isArray(a.features) ? a.features.map(f => `${f.icon} ${f.title}: ${f.desc}`).join(', ') : '';
      aboutText = `\n\n[Profil Bisnis]\n${a.heading} ${a.heading_highlight}\n${a.desc1}\n${a.desc2}` +
        (a.instagram ? `\nInstagram: ${a.instagram}` : '') +
        (a.availability ? `\nKetersediaan: ${a.availability}` : '') +
        (feats ? `\nKeunggulan: ${feats}` : '');
    }

    // --- Reviews / testimoni ---
    let reviewsText = '';
    if (reviews.rows.length > 0) {
      reviewsText = '\n\n[Testimoni Pelanggan Terbaru]\n' + reviews.rows.map(r =>
        `"${r.comment}" — ${r.name} (⭐${r.rating}/5)`
      ).join('\n');
    }

    // --- Partners ---
    let partnersText = '';
    if (partners.rows.length > 0) {
      partnersText = '\n\n[Partner / Rekanan]\n' + partners.rows.map(p =>
        p.category ? `${p.name} (${p.category})` : p.name
      ).join(', ');
    }

    const contextText = (knowledgeText + packagesText + aboutText + reviewsText + partnersText).trim() || 'Tidak ada informasi tersedia.';

    const systemPrompt = `Kamu adalah asisten virtual WCC Langkah Baru, layanan Wedding Content Creator profesional di Prabumulih, Sumatera Selatan.

Tugas kamu: jawab pertanyaan pengunjung website dengan ramah, singkat, dan informatif dalam Bahasa Indonesia. Gunakan bahasa santai tapi tetap profesional.

Informasi yang kamu miliki:
${contextText}

Aturan penting:
- Jawab langsung dan akurat berdasarkan data di atas
- Jika ditanya harga, paket, fitur, atau perbandingan paket — gunakan data paket di atas
- Jika ditanya tentang review/testimoni — gunakan data testimoni di atas
- Jika ditanya tentang bisnis/profil — gunakan data profil bisnis di atas
- Jika tidak tahu atau di luar topik, arahkan ke WhatsApp: 6281532477237
- Jangan buat-buat informasi yang tidak ada di atas
- Tetap singkat, maksimal 3-4 kalimat per jawaban
- Gunakan emoji secukupnya agar terasa ramah`;

    const response = await fetch('https://pio.codes/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-8), // keep last 8 messages for context
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API error: ${err}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa menjawab saat ini.';
    res.json({ success: true, reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/chatbot — list all knowledge entries
app.get('/api/admin/chatbot', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chatbot_knowledge ORDER BY order_index ASC, created_at ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/admin/chatbot — create
app.post('/api/admin/chatbot', requireAdmin, async (req, res) => {
  try {
    const { category, question, answer, active, order_index } = req.body;
    const result = await pool.query(
      'INSERT INTO chatbot_knowledge (category, question, answer, active, order_index) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [category || null, question, answer, active !== false, order_index || 0]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/admin/chatbot/:id — update
app.put('/api/admin/chatbot/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, question, answer, active, order_index } = req.body;
    const result = await pool.query(
      'UPDATE chatbot_knowledge SET category=$1, question=$2, answer=$3, active=$4, order_index=$5 WHERE id=$6 RETURNING *',
      [category || null, question, answer, active !== false, order_index || 0, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/admin/chatbot/:id
app.delete('/api/admin/chatbot/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM chatbot_knowledge WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PARTNERS ────────────────────────────────────────────────────────────────

// GET /api/partners — public, active only
app.get('/api/partners', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, category, logo_data, website_url, order_index FROM partners WHERE active = TRUE ORDER BY order_index ASC, created_at ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/partners — admin, all
app.get('/api/admin/partners', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM partners ORDER BY order_index ASC, created_at ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/partners — create
app.post('/api/admin/partners', requireAdmin, async (req, res) => {
  try {
    const { name, category, logo_data, website_url, order_index, active } = req.body;
    const result = await pool.query(
      `INSERT INTO partners (name, category, logo_data, website_url, order_index, active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, category || null, logo_data || null, website_url || null, order_index || 0, active !== false]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/partners/:id — update
app.put('/api/admin/partners/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, logo_data, website_url, order_index, active } = req.body;
    const result = await pool.query(
      `UPDATE partners SET name=$1, category=$2, logo_data=$3, website_url=$4, order_index=$5, active=$6
       WHERE id=$7 RETURNING *`,
      [name, category || null, logo_data || null, website_url || null, order_index || 0, active !== false, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Partner tidak ditemukan' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/partners/:id
app.delete('/api/admin/partners/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM partners WHERE id = $1', [id]);
    res.json({ success: true, message: 'Partner berhasil dihapus' });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
