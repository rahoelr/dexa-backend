# Dexa Backend Monorepo Microservice

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
- Jalankan dari root (Docker Compose):
  - `docker compose up -d`
  - Akses:
    - API Gateway: http://localhost:8080
    - Auth Service: http://localhost:3000
    - Attendance Service: http://localhost:3001
    - MySQL Auth: host=localhost port=3307
    - MySQL Attendance: host=localhost port=3308
  - Health check:
    - `curl http://localhost:8080/health`
  - Catatan klien:
    - Semua klien (termasuk frontend) WAJIB mengakses layanan melalui API Gateway (`http://localhost:8080`). Set `VITE_API_BASE_URL=http://localhost:8080`.
  - Hentikan:
    - `docker compose down`
  - Logs cepat:
    - `docker compose logs --tail=200 api-gateway`
  - Status:
    - `docker compose ps`

## Akun Seeder (Auth Service)
- Admin (default, dapat diubah via env):
  - Email: `ADMIN_EMAIL` (default `admin@example.com`)
  - Nama: `ADMIN_NAME` (default `Admin`)
  - Password: `ADMIN_PASSWORD` (default `password`)
- Karyawan (EMPLOYEE) bawaan:
  - `employee1@example.com` / password: `password`
  - `employee2@example.com` / password: `password`
  - `employee3@example.com` / password: `password`
- Sifat seeder:
  - Idempoten: jika akun sudah ada (berdasarkan email), tidak dibuat ulang.
  - Hashing password menggunakan bcrypt.
  - Berjalan otomatis saat container `auth-user-service` start melalui entrypoint.
- Menjalankan seeder manual (lokal):
  - Masuk ke folder [auth-user-service](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service)
  - Pastikan `DATABASE_URL` terpasang
  - Jalankan: `npm run prisma:seed`
- Referensi implementasi:
  - Seeder: [seed.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/prisma/seed.ts)
  - Entrypoint: [entrypoint.sh](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/scripts/entrypoint.sh)
  - Konfigurasi script: [package.json](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/package.json)

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
73→- Attendance (memerlukan Bearer token hasil login):
74→  - POST /attendance/check-in — absen masuk
75→  - POST /attendance/check-out — absen keluar
76→  - GET /attendance/me?from&to&page&pageSize — riwayat saya
77→  - Referensi: [attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/attendance.controller.ts)

## Akses Foto Absensi via Gateway
- Ringkasan alur:
  - Frontend meminta `GET http://localhost:8080/attendance/photo/:filename`.
  - Gateway mem-proxy ke attendance-service yang menyajikan file dari `data/database/photos`.
  - URL foto biasanya tersimpan sebagai `photoUrl` di record absensi saat check-in.
- Rute terkait:
  - Gateway publik foto: [attendance.public.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/attendance.public.controller.ts#L6-L14)
  - Gateway attendance: [attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/attendance.controller.ts#L11-L108)
  - Admin attendance: [admin-attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/admin-attendance.controller.ts#L9-L27)
  - Service upload foto: [attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/attendance.controller.ts#L28-L53)
- API untuk frontend:
  - Karyawan: `GET http://localhost:8080/attendance/me?from=&to=&page=&pageSize=` (JWT)
  - Admin: `GET http://localhost:8080/admin/attendance?userId=&from=&to=&page=&pageSize=` (JWT admin)
  - Admin hari ini: `GET http://localhost:8080/admin/attendance/today?page=&pageSize=` (JWT admin)
  - Foto: `GET http://localhost:8080/attendance/photo/:filename`
- Contoh render foto per absensi (React):

```jsx
function AttendanceListMe() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    fetch('http://localhost:8080/attendance/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(d => setItems(d.items || []));
  }, []);
  return (
    <ul>
      {items.map(it => (
        <li key={it.id}>
          <span>{it.date}</span>
          {it.photoUrl && (
            <img
              src={it.photoUrl.startsWith('http') ? it.photoUrl : `http://localhost:8080${it.photoUrl}`}
              alt="Attendance"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
```

- Detail penting:
  - Gateway menyusun URL foto absolut saat upload di check-in (lihat [attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/attendance.controller.ts#L66-L72)).
  - Jika file tidak ada, service mengembalikan 404 (lihat [photo.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/photo.controller.ts#L12-L15)).
  - CORS ditangani gateway saat ada header `Origin` (lihat [proxy.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/proxy.service.ts#L77-L87)).
