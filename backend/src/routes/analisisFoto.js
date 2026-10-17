const express = require('express');
const multer = require('multer');
const verifikasiToken = require('../middleware/auth');
const { unggahFoto, lihatRiwayatAnalisis } = require('../controllers/analisisFotoController');

const router = express.Router();

// Foto ditahan di memori dulu; baru disimpan ke disk jika analisis berhasil
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // maks 5 MB (NFR-22)
});

// Menangani error ukuran file dari multer dengan pesan sesuai SRS
function terimaFoto(req, res, next) {
  upload.single('foto')(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ pesan: 'Ukuran foto maksimal 5 MB' });
    }
    if (err) {
      return res.status(400).json({ pesan: 'Foto gagal diunggah' });
    }
    next();
  });
}

router.use(verifikasiToken);

router.post('/', terimaFoto, unggahFoto);
router.get('/:idWadah', lihatRiwayatAnalisis);

module.exports = router;