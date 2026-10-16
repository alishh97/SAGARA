const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// UC-01: Registrasi Akun
async function registrasi(req, res) {
  const { nama, email, kataSandi } = req.body;

  if (!nama || !email || !kataSandi) {
    return res.status(400).json({ pesan: 'Harap isi kolom ini' });
  }
  if (!FORMAT_EMAIL.test(email)) {
    return res.status(400).json({ pesan: 'Format email tidak valid' });
  }

  try {
    const cek = await pool.query('SELECT id_pengguna FROM pengguna WHERE email = $1', [email]);
    if (cek.rows.length > 0) {
      return res.status(409).json({ pesan: 'Email sudah digunakan, silakan gunakan email lain' });
    }

    const kataSandiHash = await bcrypt.hash(kataSandi, 10);
    const hasil = await pool.query(
      `INSERT INTO pengguna (nama, email, kata_sandi_hash)
       VALUES ($1, $2, $3)
       RETURNING id_pengguna, nama, email, status_akun`,
      [nama, email, kataSandiHash]
    );

    res.status(201).json({ pesan: 'Registrasi berhasil', pengguna: hasil.rows[0] });
  } catch (err) {
    res.status(500).json({ pesan: 'Terjadi kesalahan server, silakan coba lagi nanti' });
  }
}

// UC-02: Login
async function login(req, res) {
  const { email, kataSandi } = req.body;

  if (!email || !kataSandi) {
    return res.status(400).json({ pesan: 'Harap isi kolom ini' });
  }

  try {
    const hasil = await pool.query('SELECT * FROM pengguna WHERE email = $1', [email]);
    const pengguna = hasil.rows[0];

    // Pesan sama untuk email/kata sandi salah agar tidak membocorkan email terdaftar
    if (!pengguna || !(await bcrypt.compare(kataSandi, pengguna.kata_sandi_hash))) {
      return res.status(401).json({ pesan: 'Email atau kata sandi salah' });
    }

    const token = jwt.sign(
      { idPengguna: pengguna.id_pengguna, peran: pengguna.peran },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      pesan: 'Login berhasil',
      token,
      pengguna: {
        idPengguna: pengguna.id_pengguna,
        nama: pengguna.nama,
        email: pengguna.email,
        statusAkun: pengguna.status_akun,
      },
    });
  } catch (err) {
    res.status(500).json({ pesan: 'Terjadi kesalahan server, silakan coba lagi nanti' });
  }
}

module.exports = { registrasi, login };