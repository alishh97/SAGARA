# Menjalankan SAGARA dengan Docker

Cara ini menjalankan frontend, backend, dan database PostgreSQL sekaligus, tanpa perlu memasang Node.js atau PostgreSQL.

## Yang dibutuhkan
- Docker Desktop (Windows/macOS) atau Docker Engine (Linux), dalam keadaan berjalan
- API key Gemini

## Langkah
1. Clone repo ini, lalu buka terminal di folder utamanya.
2. Salin `.env.example` menjadi `.env`:
   - Windows (PowerShell): `copy .env.example .env`
   - macOS/Linux: `cp .env.example .env`
3. Buka `.env`, isi `DB_PASSWORD`, `JWT_SECRET`, dan `GEMINI_API_KEY`.
4. Jalankan:
   ```
   docker compose up --build
   ```
   Build pertama butuh beberapa menit.
5. Buka **http://localhost:8080** di browser.

## Perintah lain
| Perintah | Fungsi |
|---|---|
| `docker compose up -d` | Menjalankan di latar belakang |
| `docker compose down` | Menghentikan aplikasi (data tetap tersimpan) |
| `docker compose down -v` | Menghentikan dan **menghapus semua data** (database dan foto), untuk mengulang dari awal |
| `docker compose logs -f backend` | Melihat log backend |
| `docker compose up --build` | Menjalankan ulang setelah ada perubahan kode |

## Catatan
- Skema database dari `backend/database/schema.sql` dibuat otomatis **hanya saat pertama kali** dijalankan. Jika skema berubah, jalankan `docker compose down -v` lalu `docker compose up --build`.
- File `.env` berisi API key, jangan di-commit ke GitHub.
- Jika port 8080 sudah dipakai aplikasi lain, ubah `"8080:80"` di `docker-compose.yml`, misalnya menjadi `"8081:80"`.
