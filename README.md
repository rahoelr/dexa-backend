# Dexa Backend Monorepo

Backend monorepo berisi 3 layanan berbasis NestJS yang dipisah per domain dan diorkestrasi dengan Docker Compose.

## Struktur Layanan
- auth-user-service — autentikasi dan manajemen karyawan. Port 3000. MySQL khusus.
- attendance-service — pencatatan presensi (check-in, check-out, riwayat saya). Port 3001. MySQL khusus.
- api-gateway — entry point HTTP (reverse proxy ringan) yang meneruskan request ke dua layanan di port 8080.

Lihat compose: [docker-compose.yml](file:///Users/rahoolll/dexa-technical-test/dexa-backend/docker-compose.yml)

## Arsitektur Singkat
- Klien → API Gateway (8080) → Auth Service (3000) / Attendance Service (3001)
- Masing-masing service memiliki database MySQL terpisah untuk isolasi data:
  - mysql_auth di port host 3307
  - mysql_attendance di port host 3308

## Cara Menjalankan
- Rekomendasi (Makefile):
  - `make build-up`
- Alternatif (Makefile):
  - `make build`
  - `make up`
- Opsi utilitas Makefile:
  - `make down` untuk stop
  - `make logs` untuk tail logs
  - `make ps` untuk status
- Alternatif (Docker Compose di root):
  - `docker compose up -d --build`
- Pengembangan terisolasi per layanan:
  - Masuk ke folder layanan (mis. `auth-user-service/`) lalu `docker compose up -d`
- Detail target: [Makefile](file:///Users/rahoolll/dexa-technical-test/dexa-backend/Makefile)

## Konfigurasi Lingkungan (Default)
- Auth Service:
  - PORT: 3000
  - JWT_SECRET: rahulrtest
  - Admin seed: ADMIN_NAME=Admin, ADMIN_EMAIL=admin@example.com, ADMIN_PASSWORD=password
  - Database: `mysql_auth` (diprovide oleh compose)
- Attendance Service:
  - PORT: 3001
  - JWT_SECRET: rahulrtest
  - Database: `mysql_attendance`
- API Gateway:
  - PORT: 8080
  - AUTH_SERVICE_URL: http://auth-user-service:3000
  - ATTENDANCE_SERVICE_URL: http://attendance-service:3001

Sumber konfigurasi: [docker-compose.yml](file:///Users/rahoolll/dexa-technical-test/dexa-backend/docker-compose.yml)

## Endpoint Utama via Gateway (8080)
- Auth:
  - POST /auth/login — login dan mendapatkan JWT
  - POST /auth/register — membuat karyawan; akses admin
  - GET /auth/me — memeriksa payload token
  - Referensi: [auth.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/auth.controller.ts)
- Employees (admin):
  - GET /employees — list
  - POST /employees — create
  - GET /employees/:id — detail
  - PUT /employees/:id — update
  - DELETE /employees/:id — delete
  - Referensi: [employees.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.controller.ts)
- Attendance (memerlukan Bearer token hasil login):
  - POST /attendance/check-in — absen masuk
  - POST /attendance/check-out — absen keluar
  - GET /attendance/me?from&to&page&pageSize — riwayat saya
  - Referensi: [attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/attendance.controller.ts)

## Catatan
- Port default:
  - Auth: 3000
  - Attendance: 3001
  - Gateway: 8080
  - MySQL Auth: host 3307 → container 3306
  - MySQL Attendance: host 3308 → container 3306
