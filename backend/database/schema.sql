DROP TABLE IF EXISTS wadah;
DROP TABLE IF EXISTS pengguna;

CREATE TABLE pengguna (
  id_pengguna SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  kata_sandi_hash VARCHAR(255) NOT NULL,
  peran VARCHAR(10) NOT NULL DEFAULT 'PENGGUNA' CHECK (peran IN ('PENGGUNA', 'ADMIN')),
  status_akun VARCHAR(10) NOT NULL DEFAULT 'GRATIS' CHECK (status_akun IN ('GRATIS', 'PREMIUM')),
  tanggal_daftar TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wadah (
  id_wadah SERIAL PRIMARY KEY,
  id_pengguna INT NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  nama_wadah VARCHAR(100) NOT NULL,
  jenis_wadah VARCHAR(10) NOT NULL CHECK (jenis_wadah IN ('AKUARIUM', 'KOLAM')),
  volume NUMERIC(10,2),
  tanggal_dibuat TIMESTAMP DEFAULT NOW()
);

CREATE TABLE hewan_wadah (
  id_hewan SERIAL PRIMARY KEY,
  id_wadah INT NOT NULL REFERENCES wadah(id_wadah) ON DELETE CASCADE,
  jenis_hewan VARCHAR(100) NOT NULL,
  jumlah INT NOT NULL,
  tujuan VARCHAR(15) NOT NULL CHECK (tujuan IN ('PEMELIHARAAN', 'BREEDING'))
);

CREATE TABLE parameter_air (
  id_parameter SERIAL PRIMARY KEY,
  id_wadah INT NOT NULL REFERENCES wadah(id_wadah) ON DELETE CASCADE,
  suhu NUMERIC(5,2),
  ph NUMERIC(4,2),
  tanggal_catat TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pesan_chat (
  id_pesan SERIAL PRIMARY KEY,
  id_wadah INT NOT NULL REFERENCES wadah(id_wadah) ON DELETE CASCADE,
  pengirim VARCHAR(20) NOT NULL CHECK (pengirim IN ('PENGGUNA', 'AI')),
  isi_pesan TEXT NOT NULL,
  waktu_kirim TIMESTAMP DEFAULT NOW()
);

CREATE TABLE log_penggunaan_ai (
  id_log SERIAL PRIMARY KEY,
  id_pengguna INT NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  jenis_layanan VARCHAR(15) NOT NULL CHECK (jenis_layanan IN ('CHATBOT', 'ANALISIS_FOTO')),
  status VARCHAR(20) NOT NULL,
  waktu TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analisis_foto (
  id_analisis SERIAL PRIMARY KEY,
  id_wadah INT NOT NULL REFERENCES wadah(id_wadah) ON DELETE CASCADE,
  path_foto VARCHAR(255) NOT NULL,
  hasil_analisis TEXT NOT NULL,
  waktu_analisis TIMESTAMP DEFAULT NOW()
);








