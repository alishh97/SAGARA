const express = require('express');
const verifikasiToken = require('../middleware/auth');
const { kirimPesan, lihatRiwayatChat, hapusRiwayatChat, ringkasanRiwayat } = require('../controllers/chatController');

const router = express.Router();
router.use(verifikasiToken);

router.post('/', kirimPesan);
router.get('/', ringkasanRiwayat);
router.get('/:idWadah', lihatRiwayatChat);
router.delete('/:idWadah', hapusRiwayatChat);

module.exports = router;