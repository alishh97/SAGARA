# SAGARA

Aplikasi web asisten pemeliharaan dan breeding hewan air berbasis AI, dengan chatbot yang memahami konteks setiap wadah (akuarium atau kolam) dan analisis kondisi dari foto.

## Latar Belakang

Penghobi akuarium dan pembudidaya hewan air sering mengelola lebih dari satu wadah dengan kondisi berbeda. Saat bertanya ke AI umum, mereka harus menjelaskan ulang ukuran wadah, jenis hewan, dan parameter air setiap kali. SAGARA menyimpan profil setiap wadah sekali, lalu menyisipkannya otomatis sebagai konteks setiap kali pengguna bertanya atau mengunggah foto.

## Fitur

AI diterapkan dalam dua bentuk yang saling terhubung:
1. **Chatbot kontekstual**: menjawab berdasarkan data wadah yang sedang aktif dan riwayat percakapannya.
2. **Analisis foto**: mendeteksi indikasi kondisi hewan dan air dari foto, lalu hasilnya dapat dibahas lebih lanjut dengan chatbot.

| ID | Fitur | Status |
|---|---|---|
| RF-01 | Registrasi Akun | ✅ |
| RF-02 | Login | ✅ |
| RF-03 | Logout | ✅ |
| RF-04 | Reset Kata Sandi | ⏳ |
| RF-05 | Menambah Wadah (dengan pemeriksaan kuota) | ✅ |
| RF-06 | Melihat Daftar Wadah | ✅ |
| RF-07 | Melihat Detail Wadah | ✅ |
| RF-08 | Mengedit Data Wadah | ⏳ |
| RF-09 | Menghapus Wadah | ⏳ |
| RF-10 | Memilih Wadah Aktif | ✅ |
| RF-11 | Bertanya kepada Chatbot AI | ✅ |
| RF-12 | Memproses Konsultasi Chatbot (context-aware) | ✅ |
| RF-13 | Mengunggah Foto untuk Analisis | ✅ |
| RF-14 | Memproses Analisis Foto AI | ✅ |
| RF-15 | Melihat Riwayat Wadah | ⏳ |
| RF-16 | Menghapus Riwayat Wadah | ⏳ |
| RF-17 | Melihat Status Kuota Akun | ⏳ |
| RF-18 | Upgrade ke Akun Premium | ⏳ |
| RF-19 | Mengubah Data Akun | ⏳ |
| RF-20 – RF-23 | Panel Admin | ⏳ |

✅ selesai · ⏳ tahap pengembangan berikutnya

**Progres yg udah: 11 dari 23 kebutuhan fungsional.**

## Paket Freemium

| Paket | Harga | Wadah | Chat | Analisis foto |
|---|---|---|---|---|
| Gratis | Rp0 | 2 | 10 per hari | 5 per bulan |
| Hobi | Rp29.999/bulan | 5 | 30 per hari | 30 per bulan |
| Pembudidaya | Rp79.999/bulan | 20 | 100 per hari | 100 per bulan |

Kuota chat dan analisis foto hanya berkurang jika layanan AI berhasil memberi jawaban.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Front-end | Vue 3, Vue Router, Pinia, Tailwind CSS |
| Back-end | Node.js, Express (REST API, JWT, bcrypt) |
| Basis data | PostgreSQL |
| Layanan AI | Gemini API (teks dan vision) |

## Struktur Folder

```
SAGARA/
├── backend/
│   ├── database/schema.sql     skema tabel PostgreSQL
│   ├── src/
│   │   ├── config/             koneksi basis data
│   │   ├── controllers/        logika fitur (auth, wadah, chat, analisis foto)
│   │   ├── middleware/         verifikasi token JWT
│   │   ├── routes/             daftar endpoint API
│   │   ├── services/           integrasi Gemini API
│   │   └── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── components/         tata letak (sidebar dan navigasi seluler)
        ├── router/             daftar halaman dan penjaga login
        ├── services/           pemanggil API
        ├── stores/             state Pinia (sesi login, wadah aktif)
        └── views/              halaman aplikasi
```

## Cara Menjalankan

**Kebutuhan:** Node.js (LTS), PostgreSQL, dan API key Gemini dari [Google AI Studio](https://aistudio.google.com).

### 1. Basis data
Buat database `sagara_db`, lalu jalankan isi `backend/database/schema.sql`.

### 2. Back-end
```bash
cd backend
npm install
```
Salin `.env.example` menjadi `.env`, lalu isi password PostgreSQL, `JWT_SECRET`, dan `GEMINI_API_KEY`.
```bash
npm run dev
```
Server berjalan di `http://localhost:3000`.

### 3. Front-end
Di terminal lain:
```bash
cd frontend
npm install
npm run dev
```
Buka `http://localhost:5173`.

## Endpoint API

| Metode | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/register` | Registrasi akun |
| POST | `/api/auth/login` | Login, mengembalikan token JWT |
| GET | `/api/wadah` | Daftar wadah milik pengguna |
| GET | `/api/wadah/kuota` | Pemeriksaan kuota wadah |
| GET | `/api/wadah/:id` | Detail wadah, hewan, dan parameter air |
| POST | `/api/wadah` | Menambah wadah |
| POST | `/api/chat` | Bertanya kepada chatbot (opsional dengan `idAnalisis`) |
| GET | `/api/chat/:idWadah` | Riwayat chat satu wadah |
| POST | `/api/analisis-foto` | Unggah dan analisis foto (JPG/PNG, maks 5 MB) |
| GET | `/api/analisis-foto/:idWadah` | Riwayat analisis foto satu wadah |

Seluruh endpoint selain `/api/auth` memerlukan header `Authorization: Bearer <token>`.

## Dokumen

- Software Requirements Specification (SRS)
- Software Design Document (SDD)
- Video pitching: ......

## Catatan

Hasil chatbot dan analisis foto bersifat edukasi awal dan indikatif, bukan diagnosis profesional. Untuk kasus serius, konsultasikan dengan ahli perikanan atau dokter hewan akuatik.
