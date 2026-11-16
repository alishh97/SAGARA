const bcrypt = require('bcrypt');
const pool = require('../config/db');

const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Aturan kata sandi sama dengan registrasi: minimal 8 karakter, ada huruf dan angka
function kataSandiValid(k) {
  return k.length >= 8 && /[A-Za-z]/.test(k) && /[0-9]/.test(k);
}

// UC-19 langkah 1: ambil data akun untuk ditampilkan di form Profil
async function lihatAkun(req, res) {
  try {
    const hasil = await pool.query(
      'SELECT nama, email, status_akun, tanggal_daftar FROM pengguna WHERE id_pengguna = $1',
      [req.idPengguna]
    );
    if (hasil.rows.length === 0) {
      return res.status(404).json({ pesan: 'Akun tidak ditemukan' });
    }
    res.json({ akun: hasil.rows[0] });
  } catch (err) {
    res.status(500).json({ pesan: 'Gagal memuat data akun, silakan coba lagi nanti' });
  }
}

// UC-19: Mengubah Data Akun (nama, email, dan opsional kata sandi)
async function ubahAkun(req, res) {
  const nama = (req.body.nama || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const { kataSandiLama, kataSandiBaru } = req.body;

  if (!nama || !email) {
    return res.status(400).json({ pesan: 'Harap isi kolom ini' });
  }
  if (!FORMAT_EMAIL.test(email)) {
    return res.status(400).json({ pesan: 'Format email tidak valid' });
  }

  try {
    const akun = await pool.query('SELECT * FROM pengguna WHERE id_pengguna = $1', [req.idPengguna]);
    if (akun.rows.length === 0) {
      return res.status(404).json({ pesan: 'Akun tidak ditemukan' });
    }

    // Email baru tidak boleh dipakai akun lain
    const cekEmail = await pool.query(
      'SELECT id_pengguna FROM pengguna WHERE email = $1 AND id_pengguna <> $2',
      [email, req.idPengguna]
    );
    if (cekEmail.rows.length > 0) {
      return res.status(409).json({ pesan: 'Email sudah digunakan, silakan gunakan email lain' });
    }

    // Kata sandi hanya diganti jika kolom kata sandi baru diisi
    let hashBaru = null;
    if (kataSandiBaru) {
      if (!kataSandiLama || !(await bcrypt.compare(kataSandiLama, akun.rows[0].kata_sandi_hash))) {
        return res.status(400).json({ pesan: 'Kata sandi lama salah' });
      }
      if (!kataSandiValid(kataSandiBaru)) {
        return res.status(400).json({ pesan: 'Kata sandi minimal 8 karakter dan harus mengandung huruf dan angka' });
      }
      hashBaru = await bcrypt.hash(kataSandiBaru, 10);
    }

    const hasil = await pool.query(
      `UPDATE pengguna
       SET nama = $1, email = $2, kata_sandi_hash = COALESCE($3, kata_sandi_hash)
       WHERE id_pengguna = $4
       RETURNING id_pengguna, nama, email, status_akun`,
      [nama, email, hashBaru, req.idPengguna]
    );
    const p = hasil.rows[0];
    res.json({
      pesan: 'Perubahan data akun berhasil disimpan',
      pengguna: { idPengguna: p.id_pengguna, nama: p.nama, email: p.email, statusAkun: p.status_akun },
    });
  } catch (err) {
    res.status(500).json({ pesan: 'Perubahan gagal disimpan, silakan coba lagi nanti' });
  }
}

module.exports = { lihatAkun, ubahAkun };
