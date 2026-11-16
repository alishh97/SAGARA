const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const wadahRoutes = require('./routes/wadah');
app.use('/api/wadah', wadahRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const path = require('path');
const analisisFotoRoutes = require('./routes/analisisFoto');
app.use('/api/analisis-foto', analisisFotoRoutes);

// Menyajikan foto hasil unggahan agar bisa ditampilkan di frontend
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Endpoint uji untuk memastikan server dan database terhubung
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', waktu_db: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', pesan: err.message });
  }
});

// Pembaruan struktur database yang sudah berjalan (schema.sql hanya dijalankan saat database pertama kali dibuat)
pool
  .query('ALTER TABLE log_penggunaan_ai ADD COLUMN IF NOT EXISTS jumlah_token INT NOT NULL DEFAULT 0')
  .catch((err) => console.error('Gagal memperbarui tabel log_penggunaan_ai:', err.message));

// Membuat akun admin dari .env (ADMIN_EMAIL dan ADMIN_PASSWORD) jika belum ada.
// Admin dipegang pengembang, jadi tidak ada halaman registrasi admin.
async function siapkanAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const kataSandi = process.env.ADMIN_PASSWORD;
  if (!email || !kataSandi) return;
  try {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(kataSandi, 10);
    await pool.query(
      `INSERT INTO pengguna (nama, email, kata_sandi_hash, peran)
       VALUES ('Admin SAGARA', $1, $2, 'ADMIN')
       ON CONFLICT (email) DO UPDATE SET peran = 'ADMIN', kata_sandi_hash = EXCLUDED.kata_sandi_hash`,
      [email, hash]
    );
    console.log('Akun admin siap:', email);
  } catch (err) {
    console.error('Gagal menyiapkan akun admin:', err.message);
  }
}
siapkanAdmin();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server SAGARA berjalan di port ${PORT}`));