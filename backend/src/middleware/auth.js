const jwt = require('jsonwebtoken');

// Memastikan request membawa token login yang valid
function verifikasiToken(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(' ')[1]; // format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ pesan: 'Silakan login terlebih dahulu' });
  }

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.idPengguna = data.idPengguna;
    next();
  } catch (err) {
    return res.status(401).json({ pesan: 'Sesi tidak valid atau sudah berakhir' });
  }
}

module.exports = verifikasiToken;