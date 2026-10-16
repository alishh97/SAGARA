const express = require('express');
const verifikasiToken = require('../middleware/auth');
const {
  cekKuotaWadah,
  tambahWadah,
  lihatDaftarWadah,
  lihatDetailWadah,
} = require('../controllers/wadahController');

const router = express.Router();

// Semua endpoint wadah hanya untuk pengguna yang sudah login
router.use(verifikasiToken);

router.get('/kuota', cekKuotaWadah);
router.get('/', lihatDaftarWadah);
router.get('/:id', lihatDetailWadah);
router.post('/', tambahWadah);

module.exports = router;