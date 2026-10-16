const express = require('express');
const { registrasi, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registrasi);
router.post('/login', login);

module.exports = router;