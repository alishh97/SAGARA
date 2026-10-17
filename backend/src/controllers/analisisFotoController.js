const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { kirimPromptAnalisisFoto } = require('../services/geminiAPIService');

// Batas analisis foto per bulan (SRS Tabel 2.1). Akun premium nanti dibaca dari paket di tabel Langganan.
const BATAS_FOTO_BULANAN = { GRATIS: 5, PREMIUM: 30 };
const FOLDER_UPLOAD = path.join(__dirname, '..', '..', 'uploads');
const PENANDA_BUKAN_HEWAN_AIR = 'BUKAN_HEWAN_AIR';

const INSTRUKSI_SISTEM = `Kamu adalah asisten SAGARA yang menganalisis foto hewan air atau wadahnya
(akuarium/kolam). Jika foto TIDAK menunjukkan hewan air atau wadah pemeliharaannya,
balas hanya dengan teks: ${PENANDA_BUKAN_HEWAN_AIR}
Jika sesuai, jelaskan dalam bahasa Indonesia yang mudah dipahami pengguna awam:
1. Kondisi yang terlihat (hewan dan air)
2. Dugaan masalah, jika ada
3. Saran tindakan
Jawab ringkas, maksimal sekitar 150 kata, dengan poin-poin singkat.
Hasil bersifat indikatif dan edukasi awal, bukan diagnosis profesional.`;

// validasiFoto(): cek format dari isi berkas (magic number), bukan dari nama file
function deteksiFormat(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', ekstensi: 'jpg' };
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return { mime: 'image/png', ekstensi: 'png' };
  return null;
}

async function catatLog(idPengguna, status) {
  await pool.query(
    "INSERT INTO log_penggunaan_ai (id_pengguna, jenis_layanan, status) VALUES ($1, 'ANALISIS_FOTO', $2)",
    [idPengguna, status]
  );
}

// hitungPenggunaan(ANALISIS_FOTO, bulanIni)
async function hitungFotoBulanIni(idPengguna) {
  const hasil = await pool.query(
    `SELECT COUNT(*) FROM log_penggunaan_ai
     WHERE id_pengguna = $1 AND jenis_layanan = 'ANALISIS_FOTO' AND status = 'BERHASIL'
       AND date_trunc('month', waktu) = date_trunc('month', NOW())`,
    [idPengguna]
  );
  return Number(hasil.rows[0].count);
}

// UC-13 + UC-14: Mengunggah dan Memproses Analisis Foto
async function unggahFoto(req, res) {
  const { idWadah } = req.body;

  if (!req.file) {
    return res.status(400).json({ pesan: 'Harap pilih foto terlebih dahulu' });
  }
  const format = deteksiFormat(req.file.buffer);
  if (!format) {
    return res.status(400).json({ pesan: 'Format harus JPG atau PNG' });
  }

  try {
    const wadahHasil = await pool.query(
      'SELECT * FROM wadah WHERE id_wadah = $1 AND id_pengguna = $2',
      [idWadah, req.idPengguna]
    );
    const wadah = wadahHasil.rows[0];
    if (!wadah) {
      return res.status(404).json({ pesan: 'Wadah tidak ditemukan' });
    }

    const akun = await pool.query('SELECT status_akun FROM pengguna WHERE id_pengguna = $1', [req.idPengguna]);
    const batas = BATAS_FOTO_BULANAN[akun.rows[0].status_akun];
    const terpakai = await hitungFotoBulanIni(req.idPengguna);
    if (terpakai >= batas) {
      return res.status(403).json({ pesan: 'Kuota analisis foto bulan ini sudah habis', terpakai, batas });
    }

    // Konteks wadah untuk prompt (tanpa data pribadi pengguna, NFR-13)
    const hewan = await pool.query('SELECT jenis_hewan, jumlah FROM hewan_wadah WHERE id_wadah = $1', [wadah.id_wadah]);
    const daftarHewan = hewan.rows.map((h) => `${h.jenis_hewan} (${h.jumlah} ekor)`).join(', ');
    const prompt = `Wadah: ${wadah.jenis_wadah.toLowerCase()} "${wadah.nama_wadah}", volume ${wadah.volume} liter.
Hewan yang dipelihara: ${daftarHewan || '-'}.
Identifikasi indikasi kondisi kesehatan hewan dan kondisi air pada foto ini.`;

    let hasil;
    try {
      hasil = await kirimPromptAnalisisFoto(INSTRUKSI_SISTEM, prompt, req.file.buffer.toString('base64'), format.mime);
    } catch (errAI) {
      // Gagal: foto dan hasil tidak disimpan, kuota tidak berkurang (UC-13 & UC-14)
      console.error('Gemini gagal:', errAI.message);
      await catatLog(req.idPengguna, 'GAGAL');
      return res.status(503).json({ pesan: 'Layanan analisis sementara tidak tersedia, silakan coba lagi nanti' });
    }

    await catatLog(req.idPengguna, 'BERHASIL');

    // Foto bukan hewan air/wadah: tidak disimpan, tetap dihitung kuota (UC-14)
    if (hasil.trim().startsWith(PENANDA_BUKAN_HEWAN_AIR)) {
      return res.status(422).json({ pesan: 'Foto tidak menunjukkan hewan air atau wadah, silakan unggah foto lain' });
    }

    // simpanHasilAnalisis(): simpan berkas foto dan hasilnya sebagai riwayat wadah
    fs.mkdirSync(FOLDER_UPLOAD, { recursive: true });
    const namaFile = `wadah${wadah.id_wadah}_${Date.now()}.${format.ekstensi}`;
    fs.writeFileSync(path.join(FOLDER_UPLOAD, namaFile), req.file.buffer);

    const simpan = await pool.query(
      'INSERT INTO analisis_foto (id_wadah, path_foto, hasil_analisis) VALUES ($1, $2, $3) RETURNING *',
      [wadah.id_wadah, `/uploads/${namaFile}`, hasil]
    );

    res.status(201).json({ analisis: simpan.rows[0], sisaKuota: batas - terpakai - 1 });
  } catch (err) {
    console.error('Error analisis foto:', err.message);
    res.status(500).json({ pesan: 'Terjadi kesalahan server, silakan coba lagi nanti' });
  }
}

// Riwayat analisis foto satu wadah
async function lihatRiwayatAnalisis(req, res) {
  try {
    const wadah = await pool.query(
      'SELECT id_wadah FROM wadah WHERE id_wadah = $1 AND id_pengguna = $2',
      [req.params.idWadah, req.idPengguna]
    );
    if (wadah.rows.length === 0) {
      return res.status(404).json({ pesan: 'Wadah tidak ditemukan' });
    }
    const hasil = await pool.query(
      'SELECT * FROM analisis_foto WHERE id_wadah = $1 ORDER BY waktu_analisis DESC',
      [req.params.idWadah]
    );
    res.json({ analisis: hasil.rows });
  } catch (err) {
    res.status(500).json({ pesan: 'Gagal memuat riwayat analisis, silakan coba lagi nanti' });
  }
}

module.exports = { unggahFoto, lihatRiwayatAnalisis };