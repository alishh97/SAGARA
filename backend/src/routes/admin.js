const express = require('express');
const verifikasiToken = require('../middleware/auth');
const { loginAdmin, daftarPengguna, statistikAI } = require('../controllers/adminController');

const router = express.Router();

// Panel admin bersifat view-only: hanya endpoint GET selain login
router.post('/login', loginAdmin);

// Endpoint di bawah ini hanya untuk token berperan ADMIN
router.use(verifikasiToken, (req, res, next) => {
  if (req.peran !== 'ADMIN') {
    return res.status(403).json({ pesan: 'Akun tidak memiliki akses ke panel admin' });
  }
  next();
});

router.get('/pengguna', daftarPengguna);
router.get('/statistik', statistikAI);

module.exports = router;
