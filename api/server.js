import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const { Pool } = pg;
const app = express();
const PORT = 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

app.use(cors());
app.use(express.json());

// GET all orders (optional ?status= filter)
app.get('/api/orders', async (req, res) => {
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

// POST create order
app.post('/api/orders', async (req, res) => {
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

// POST update order status
app.post('/api/orders/:id/status', async (req, res) => {
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

// Serve built React app in production
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
