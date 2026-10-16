const pool = require('../config/db');

const JENIS_WADAH = ['AKUARIUM', 'KOLAM'];
const TUJUAN = ['PEMELIHARAAN', 'BREEDING'];

// Batas wadah per jenis akun (SRS Tabel 2.1). Akun premium nanti dibaca dari paket di tabel Langganan.
const BATAS_WADAH = { GRATIS: 2, PREMIUM: 20 };

// bolehTambahWadah(): memeriksa jumlah wadah terhadap batas akun
async function periksaKuotaWadah(idPengguna) {
  const akun = await pool.query('SELECT status_akun FROM pengguna WHERE id_pengguna = $1', [idPengguna]);
  const statusAkun = akun.rows[0].status_akun;
  const jumlah = await pool.query('SELECT COUNT(*) FROM wadah WHERE id_pengguna = $1', [idPengguna]);

  const terpakai = Number(jumlah.rows[0].count);
  const batas = BATAS_WADAH[statusAkun];
  return { statusAkun, terpakai, batas, boleh: terpakai < batas };
}

function pesanKuotaPenuh(statusAkun) {
  return statusAkun === 'GRATIS'
    ? 'Kuota wadah akun gratis sudah penuh. Upgrade ke akun premium untuk menambah wadah.'
    : 'Batas wadah pada paket Anda telah tercapai';
}

// UC-05 langkah 1: dipanggil saat pengguna menekan "Tambah Wadah"
async function cekKuotaWadah(req, res) {
  try {
    const kuota = await periksaKuotaWadah(req.idPengguna);
    if (!kuota.boleh) {
      return res.status(403).json({ ...kuota, pesan: pesanKuotaPenuh(kuota.statusAkun) });
    }
    res.json(kuota);
  } catch (err) {
    res.status(500).json({ pesan: 'Gagal memeriksa kuota, silakan coba lagi nanti' });
  }
}

// UC-05: Menambah Wadah (wadah + hewan + parameter air disimpan bersamaan)
async function tambahWadah(req, res) {
  const { namaWadah, jenisWadah, volume, hewan, suhu, ph } = req.body;

  if (!namaWadah || !jenisWadah || !volume || !Array.isArray(hewan) || hewan.length === 0) {
    return res.status(400).json({ pesan: 'Harap isi kolom ini' });
  }
  if (!JENIS_WADAH.includes(jenisWadah)) {
    return res.status(400).json({ pesan: 'Jenis wadah harus Akuarium atau Kolam' });
  }
  for (const h of hewan) {
    if (!h.jenisHewan || !h.jumlah || !TUJUAN.includes(h.tujuan)) {
      return res.status(400).json({ pesan: 'Data hewan belum lengkap atau tidak valid' });
    }
  }

  const client = await pool.connect();
  try {
    // Kuota dicek ulang di server supaya tidak bisa dilewati dari frontend
    const kuota = await periksaKuotaWadah(req.idPengguna);
    if (!kuota.boleh) {
      return res.status(403).json({ ...kuota, pesan: pesanKuotaPenuh(kuota.statusAkun) });
    }

    // Transaksi: jika salah satu gagal, semua dibatalkan
    await client.query('BEGIN');

    const wadahBaru = await client.query(
      `INSERT INTO wadah (id_pengguna, nama_wadah, jenis_wadah, volume)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.idPengguna, namaWadah, jenisWadah, volume]
    );
    const idWadah = wadahBaru.rows[0].id_wadah;

    for (const h of hewan) {
      await client.query(
        'INSERT INTO hewan_wadah (id_wadah, jenis_hewan, jumlah, tujuan) VALUES ($1, $2, $3, $4)',
        [idWadah, h.jenisHewan, h.jumlah, h.tujuan]
      );
    }

    if (suhu || ph) {
      await client.query(
        'INSERT INTO parameter_air (id_wadah, suhu, ph) VALUES ($1, $2, $3)',
        [idWadah, suhu || null, ph || null]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ pesan: 'Wadah berhasil ditambahkan', wadah: wadahBaru.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ pesan: 'Wadah gagal disimpan, silakan coba lagi nanti' });
  } finally {
    client.release();
  }
}

// UC-06: Melihat Daftar Wadah (kartu ringkasan)
async function lihatDaftarWadah(req, res) {
  try {
    const hasil = await pool.query(
      `SELECT w.id_wadah, w.nama_wadah, w.jenis_wadah, w.volume,
              COALESCE(SUM(h.jumlah), 0) AS total_hewan
       FROM wadah w
       LEFT JOIN hewan_wadah h ON h.id_wadah = w.id_wadah
       WHERE w.id_pengguna = $1
       GROUP BY w.id_wadah
       ORDER BY w.tanggal_dibuat DESC`,
      [req.idPengguna]
    );
    res.json({ wadah: hasil.rows });
  } catch (err) {
    res.status(500).json({ pesan: 'Gagal memuat daftar wadah, silakan coba lagi nanti' });
  }
}

// UC-07: Melihat Detail Wadah
async function lihatDetailWadah(req, res) {
  try {
    const wadah = await pool.query(
      'SELECT * FROM wadah WHERE id_wadah = $1 AND id_pengguna = $2',
      [req.params.id, req.idPengguna]
    );
    if (wadah.rows.length === 0) {
      return res.status(404).json({ pesan: 'Wadah tidak ditemukan' });
    }

    const hewan = await pool.query('SELECT * FROM hewan_wadah WHERE id_wadah = $1', [req.params.id]);
    const parameter = await pool.query(
      'SELECT * FROM parameter_air WHERE id_wadah = $1 ORDER BY tanggal_catat DESC LIMIT 1',
      [req.params.id]
    );

    res.json({
      wadah: wadah.rows[0],
      hewan: hewan.rows,
      parameterAir: parameter.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ pesan: 'Gagal memuat detail wadah, silakan coba lagi nanti' });
  }
}

module.exports = { cekKuotaWadah, tambahWadah, lihatDaftarWadah, lihatDetailWadah };