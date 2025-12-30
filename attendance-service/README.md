# Attendance Service (Plain)

Proyek plain NestJS + Prisma + MySQL + Docker untuk attendance-service, mengikuti konvensi user-auth-service. Belum ada fitur bisnis; hanya healthcheck.

## Menjalankan
- Copy `.env.example` menjadi `.env` (opsional, dapat memakai default dari docker-compose).
- Jalankan:
  - `docker compose up --build` dari folder attendance-service
- Cek health:
  - `curl http://localhost:3001/health` → `OK`

## Konfigurasi
- DATABASE_URL: koneksi MySQL
- PORT: port aplikasi (default 3001)
- JWT_SECRET: disiapkan untuk keperluan masa depan
