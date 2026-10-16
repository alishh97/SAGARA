const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// RF-01: Registrasi akun pengguna baru
router.post('/register', async (req, res) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ pesan: 'Nama, email, dan password wajib diisi' });
  }

  try {
    const cek = await pool.query('SELECT id_pengguna FROM pengguna WHERE email = $1', [email]);
    if (cek.rows.length > 0) {
      return res.status(409).json({ pesan: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const hasil = await pool.query(
      'INSERT INTO pengguna (nama, email, password_hash) VALUES ($1, $2, $3) RETURNING id_pengguna, nama, email, paket',
      [nama, email, passwordHash]
    );

    res.status(201).json({ pesan: 'Registrasi berhasil', pengguna: hasil.rows[0] });
  } catch (err) {
    res.status(500).json({ pesan: 'Terjadi kesalahan server', detail: err.message });
  }
});

// RF-02: Login pengguna
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ pesan: 'Email dan password wajib diisi' });
  }

  try {
    const hasil = await pool.query('SELECT * FROM pengguna WHERE email = $1', [email]);
    const pengguna = hasil.rows[0];

    // Pesan sengaja sama untuk email/password salah agar tidak membocorkan email terdaftar
    if (!pengguna || !(await bcrypt.compare(password, pengguna.password_hash))) {
      return res.status(401).json({ pesan: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id_pengguna: pengguna.id_pengguna },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      pesan: 'Login berhasil',
      token,
      pengguna: { id_pengguna: pengguna.id_pengguna, nama: pengguna.nama, email: pengguna.email, paket: pengguna.paket },
    });
  } catch (err) {
    res.status(500).json({ pesan: 'Terjadi kesalahan server', detail: err.message });
  }
});

module.exports = router;