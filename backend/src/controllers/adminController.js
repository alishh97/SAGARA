const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// UC-20: Login Admin
async function loginAdmin(req, res) {
  const { kataSandi } = req.body;
  const email = (req.body.email || '').trim().toLowerCase();

  if (!email || !kataSandi) {
    return res.status(400).json({ pesan: 'Harap isi kolom ini' });
  }

  try {
    const hasil = await pool.query('SELECT * FROM pengguna WHERE email = $1', [email]);
    const akun = hasil.rows[0];

    if (!akun || !(await bcrypt.compare(kataSandi, akun.kata_sandi_hash))) {
      return res.status(401).json({ pesan: 'Email atau kata sandi salah' });
    }
    if (akun.peran !== 'ADMIN') {
      return res.status(403).json({ pesan: 'Akun tidak memiliki akses ke panel admin' });
    }

    const token = jwt.sign({ idPengguna: akun.id_pengguna, peran: 'ADMIN' }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    res.json({ pesan: 'Login admin berhasil', token, admin: { nama: akun.nama, email: akun.email } });
  } catch (err) {
    res.status(500).json({ pesan: 'Terjadi kesalahan server, silakan coba lagi nanti' });
  }
}

// UC-22: Melihat Daftar Pengguna dan Langganan (bisa difilter ?jenis=GRATIS / PREMIUM)
async function daftarPengguna(req, res) {
  const { jenis } = req.query;
  const filter = ['GRATIS', 'PREMIUM'].includes(jenis) ? jenis : null;

  try {
    const hasil = await pool.query(
      `SELECT p.id_pengguna, p.nama, p.email, p.status_akun, p.tanggal_daftar,
              (SELECT COUNT(*) FROM wadah w WHERE w.id_pengguna = p.id_pengguna) AS jumlah_wadah
       FROM pengguna p
       WHERE p.peran = 'PENGGUNA' AND ($1::text IS NULL OR p.status_akun = $1)
       ORDER BY p.tanggal_daftar DESC`,
      [filter]
    );
    const ringkasan = await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status_akun = 'PREMIUM') AS premium
       FROM pengguna WHERE peran = 'PENGGUNA'`
    );
    res.json({
      pengguna: hasil.rows,
      total: Number(ringkasan.rows[0].total),
      totalPremium: Number(ringkasan.rows[0].premium),
    });
  } catch (err) {
    res.status(500).json({ pesan: 'Gagal memuat daftar pengguna, silakan coba lagi nanti' });
  }
}

// Rentang waktu statistik: hari ini, 7 hari terakhir, atau 30 hari terakhir
const RENTANG_HARI = { harian: 1, mingguan: 7, bulanan: 30 };

// UC-23: Melihat Statistik Penggunaan AI (termasuk jumlah token)
async function statistikAI(req, res) {
  const periode = RENTANG_HARI[req.query.periode] ? req.query.periode : 'mingguan';
  const jumlahHari = RENTANG_HARI[periode];

  try {
    const total = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE jenis_layanan = 'CHATBOT' AND status = 'BERHASIL') AS jumlah_chat,
         COUNT(*) FILTER (WHERE jenis_layanan = 'ANALISIS_FOTO' AND status = 'BERHASIL') AS jumlah_foto,
         COUNT(*) FILTER (WHERE status <> 'BERHASIL') AS jumlah_gagal,
         COALESCE(SUM(jumlah_token), 0) AS total_token,
         COALESCE(SUM(jumlah_token) FILTER (WHERE jenis_layanan = 'CHATBOT'), 0) AS token_chat,
         COALESCE(SUM(jumlah_token) FILTER (WHERE jenis_layanan = 'ANALISIS_FOTO'), 0) AS token_foto,
         COUNT(DISTINCT id_pengguna) AS pengguna_aktif
       FROM log_penggunaan_ai
       WHERE waktu::date > CURRENT_DATE - $1::int`,
      [jumlahHari]
    );

    // Rincian per hari (hari tanpa aktivitas tetap ditampilkan dengan nilai 0)
    const perHari = await pool.query(
      `SELECT to_char(h.tanggal, 'YYYY-MM-DD') AS tanggal,
              COUNT(l.*) FILTER (WHERE l.jenis_layanan = 'CHATBOT' AND l.status = 'BERHASIL') AS chat,
              COUNT(l.*) FILTER (WHERE l.jenis_layanan = 'ANALISIS_FOTO' AND l.status = 'BERHASIL') AS foto,
              COALESCE(SUM(l.jumlah_token), 0) AS token
       FROM generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, interval '1 day') AS h(tanggal)
       LEFT JOIN log_penggunaan_ai l ON l.waktu::date = h.tanggal::date
       GROUP BY h.tanggal
       ORDER BY h.tanggal`,
      [jumlahHari]
    );

    const t = total.rows[0];
    res.json({
      periode,
      ringkasan: {
        jumlahChat: Number(t.jumlah_chat),
        jumlahFoto: Number(t.jumlah_foto),
        jumlahGagal: Number(t.jumlah_gagal),
        totalToken: Number(t.total_token),
        tokenChat: Number(t.token_chat),
        tokenFoto: Number(t.token_foto),
        penggunaAktif: Number(t.pengguna_aktif),
      },
      perHari: perHari.rows.map((r) => ({
        tanggal: r.tanggal,
        chat: Number(r.chat),
        foto: Number(r.foto),
        token: Number(r.token),
      })),
    });
  } catch (err) {
    console.error('Error statistik:', err.message);
    res.status(500).json({ pesan: 'Gagal memuat statistik, silakan coba lagi nanti' });
  }
}

module.exports = { loginAdmin, daftarPengguna, statistikAI };
