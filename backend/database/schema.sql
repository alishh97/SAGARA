CREATE TABLE pengguna (
  id_pengguna SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  paket VARCHAR(20) NOT NULL DEFAULT 'gratis'
    CHECK (paket IN ('gratis', 'hobi', 'pembudidaya')),
  dibuat_pada TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wadah (
  id_wadah SERIAL PRIMARY KEY,
  id_pengguna INT NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  nama_wadah VARCHAR(100) NOT NULL,
  jenis_wadah VARCHAR(20) NOT NULL CHECK (jenis_wadah IN ('akuarium', 'kolam')),
  jenis_hewan VARCHAR(100) NOT NULL,
  volume_liter NUMERIC(10,2),
  jumlah_hewan INT,
  catatan TEXT,
  is_aktif BOOLEAN DEFAULT FALSE,
  dibuat_pada TIMESTAMP DEFAULT NOW()
);