const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const wadahRoutes = require('./routes/wadah');
app.use('/api/wadah', wadahRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

const path = require('path');
const analisisFotoRoutes = require('./routes/analisisFoto');
app.use('/api/analisis-foto', analisisFotoRoutes);

// Menyajikan foto hasil unggahan agar bisa ditampilkan di frontend
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Endpoint uji untuk memastikan server dan database terhubung
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', waktu_db: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', pesan: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server SAGARA berjalan di port ${PORT}`));