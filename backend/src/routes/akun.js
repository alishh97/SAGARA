const express = require('express');
const verifikasiToken = require('../middleware/auth');
const { lihatAkun, ubahAkun } = require('../controllers/akunController');

const router = express.Router();
router.use(verifikasiToken);

router.get('/', lihatAkun);
router.put('/', ubahAkun);

module.exports = router;
