const express = require('express');
const verifikasiToken = require('../middleware/auth');
const {
  cekKuotaWadah,
  tambahWadah,
  lihatDaftarWadah,
  lihatDetailWadah,
  editWadah,
  hapusWadah,
} = require('../controllers/wadahController');

const router = express.Router();

// Semua endpoint wadah hanya untuk pengguna yang sudah login
router.use(verifikasiToken);

router.get('/kuota', cekKuotaWadah);
router.get('/', lihatDaftarWadah);
router.get('/:id', lihatDetailWadah);
router.post('/', tambahWadah);
router.put('/:id', editWadah);
router.delete('/:id', hapusWadah);

module.exports = router;