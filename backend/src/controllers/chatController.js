const pool = require('../config/db');
const { kirimPromptChat } = require('../services/geminiAPIService');

// Batas chat per hari (SRS Tabel 2.1). Akun premium nanti dibaca dari paket di tabel Langganan.
const BATAS_CHAT_HARIAN = { GRATIS: 10, PREMIUM: 30 };
const JUMLAH_RIWAYAT_KONTEKS = 6; // jumlah pesan terakhir yang ikut dikirim sebagai konteks

const INSTRUKSI_SISTEM = `Kamu adalah asisten SAGARA untuk pemeliharaan dan breeding hewan air.
Jawab dalam bahasa Indonesia yang mudah dipahami pengguna awam, singkat dan praktis.
Jawab ringkas, maksimal sekitar 100 kata. Jangan membuka jawaban dengan salam, langsung ke inti.
Gunakan data wadah yang diberikan sebagai konteks, jangan meminta pengguna menjelaskan ulang.
Jawabanmu bersifat edukasi awal, bukan diagnosis profesional. Untuk kasus serius seperti
kematian massal atau penyakit menular, sarankan berkonsultasi dengan ahli perikanan.`;

// Mengambil wadah sekaligus memastikan wadah milik pengguna yang login
async function ambilWadahMilikPengguna(idWadah, idPengguna) {
  const hasil = await pool.query(
    'SELECT * FROM wadah WHERE id_wadah = $1 AND id_pengguna = $2',
    [idWadah, idPengguna]
  );
  return hasil.rows[0];
}

// hitungPenggunaan(CHATBOT, hariIni): hanya permintaan berhasil yang dihitung (UC-12)
async function hitungChatHariIni(idPengguna) {
  const hasil = await pool.query(
    `SELECT COUNT(*) FROM log_penggunaan_ai
     WHERE id_pengguna = $1 AND jenis_layanan = 'CHATBOT'
       AND status = 'BERHASIL' AND waktu::date = CURRENT_DATE`,
    [idPengguna]
  );
  return Number(hasil.rows[0].count);
}

async function catatLog(idPengguna, status) {
  await pool.query(
    "INSERT INTO log_penggunaan_ai (id_pengguna, jenis_layanan, status) VALUES ($1, 'CHATBOT', $2)",
    [idPengguna, status]
  );
}

// UC-12 langkah 1-2: susun konteks wadah (tanpa nama/email pengguna, sesuai NFR-13)
async function susunPrompt(wadah, pertanyaan) {
  const hewan = await pool.query('SELECT * FROM hewan_wadah WHERE id_wadah = $1', [wadah.id_wadah]);
  const parameter = await pool.query(
    'SELECT * FROM parameter_air WHERE id_wadah = $1 ORDER BY tanggal_catat DESC LIMIT 1',
    [wadah.id_wadah]
  );
  const riwayat = await pool.query(
    'SELECT pengirim, isi_pesan FROM pesan_chat WHERE id_wadah = $1 ORDER BY waktu_kirim DESC LIMIT $2',
    [wadah.id_wadah, JUMLAH_RIWAYAT_KONTEKS]
  );

  const daftarHewan = hewan.rows
    .map((h) => `- ${h.jenis_hewan}, ${h.jumlah} ekor, tujuan ${h.tujuan.toLowerCase()}`)
    .join('\n');
  const p = parameter.rows[0];
  const teksParameter = p ? `Suhu ${p.suhu ?? '-'} °C, pH ${p.ph ?? '-'}` : 'Belum dicatat';
  const teksRiwayat = riwayat.rows
    .reverse()
    .map((r) => `${r.pengirim === 'AI' ? 'Asisten' : 'Pengguna'}: ${r.isi_pesan}`)
    .join('\n');

  return `DATA WADAH AKTIF
Nama: ${wadah.nama_wadah}
Jenis: ${wadah.jenis_wadah.toLowerCase()}, volume ${wadah.volume} liter
Hewan:
${daftarHewan}
Parameter air terakhir: ${teksParameter}

RIWAYAT PERCAKAPAN TERAKHIR
${teksRiwayat || '(belum ada)'}

PERTANYAAN PENGGUNA
${pertanyaan}`;
}

// UC-11 + UC-12: Bertanya kepada Chatbot AI
async function kirimPesan(req, res) {
    const { idWadah, pertanyaan, idAnalisis } = req.body;

  if (!pertanyaan || !pertanyaan.trim()) {
    return res.status(400).json({ pesan: 'Harap masukkan pertanyaan' });
  }

  try {
    const wadah = await ambilWadahMilikPengguna(idWadah, req.idPengguna);
    if (!wadah) {
      return res.status(404).json({ pesan: 'Wadah tidak ditemukan' });
    }

    const akun = await pool.query('SELECT status_akun FROM pengguna WHERE id_pengguna = $1', [req.idPengguna]);
    const batas = BATAS_CHAT_HARIAN[akun.rows[0].status_akun];
    const terpakai = await hitungChatHariIni(req.idPengguna);
    if (terpakai >= batas) {
      return res.status(403).json({ pesan: 'Kuota chat hari ini sudah habis', terpakai, batas });
    }

        let prompt = await susunPrompt(wadah, pertanyaan.trim());

        // Hasil analisis foto hanya disertakan jika pengguna memilih "Tanyakan lebih lanjut ke chatbot"
        if (idAnalisis) {
            const analisis = await pool.query(
                'SELECT hasil_analisis FROM analisis_foto WHERE id_analisis = $1 AND id_wadah = $2',
                [idAnalisis, wadah.id_wadah]
            );
            if (analisis.rows[0]) {
                prompt = `HASIL ANALISIS FOTO YANG DIPILIH PENGGUNA\n${analisis.rows[0].hasil_analisis}\n\n${prompt}`;
            }
        }

    let jawaban;
    try {
      jawaban = await kirimPromptChat(INSTRUKSI_SISTEM, prompt);
    } catch (errAI) {
      // Gagal: catat log GAGAL, pertanyaan tidak disimpan, kuota tidak berkurang (UC-11 & UC-12)
      console.error('Gemini gagal:', errAI.message);
      await catatLog(req.idPengguna, 'GAGAL');
      return res.status(503).json({ pesan: 'Layanan konsultasi sementara tidak tersedia, silakan coba lagi nanti' });
    }

    await catatLog(req.idPengguna, 'BERHASIL');

    // simpanJawabanAI(): simpan pertanyaan dan jawaban sebagai riwayat chat wadah
    await pool.query(
      "INSERT INTO pesan_chat (id_wadah, pengirim, isi_pesan) VALUES ($1, 'PENGGUNA', $2), ($1, 'AI', $3)",
      [wadah.id_wadah, pertanyaan.trim(), jawaban]
    );

    res.json({ jawaban, sisaKuota: batas - terpakai - 1 });
  } catch (err) {
    console.error('Error chat:', err.message);
    res.status(500).json({ pesan: 'Terjadi kesalahan server, silakan coba lagi nanti' });
  }
}

// Riwayat chat satu wadah, dipakai untuk mengisi jendela chat saat dibuka
async function lihatRiwayatChat(req, res) {
  try {
    const wadah = await ambilWadahMilikPengguna(req.params.idWadah, req.idPengguna);
    if (!wadah) {
      return res.status(404).json({ pesan: 'Wadah tidak ditemukan' });
    }
    const hasil = await pool.query(
      'SELECT id_pesan, pengirim, isi_pesan, waktu_kirim FROM pesan_chat WHERE id_wadah = $1 ORDER BY waktu_kirim ASC, id_pesan ASC',
      [wadah.id_wadah]
    );
    res.json({ pesan: hasil.rows });
  } catch (err) {
    res.status(500).json({ pesan: 'Gagal memuat riwayat chat, silakan coba lagi nanti' });
  }
}

module.exports = { kirimPesan, lihatRiwayatChat };