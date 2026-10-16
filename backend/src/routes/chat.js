const express = require('express');
const verifikasiToken = require('../middleware/auth');
const { kirimPesan, lihatRiwayatChat } = require('../controllers/chatController');

const router = express.Router();
router.use(verifikasiToken);

router.post('/', kirimPesan);
router.get('/:idWadah', lihatRiwayatChat);

module.exports = router;