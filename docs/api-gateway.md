# Dokumentasi API Gateway Dexa Backend

- Base URL default: `http://localhost:8080`
- Service target:
  - `/auth/*` dan `/employees/*` → Auth User Service (default `http://localhost:3000`)
  - `/attendance/*` dan `/admin/attendance/*` → Attendance Service (default `http://localhost:3001`)
- Konfigurasi env: `PORT`, `AUTH_SERVICE_URL`, `ATTENDANCE_SERVICE_URL`
- CORS aktif, ValidationPipe aktif (whitelist/transform)

Referensi kode: [main.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/main.ts), [app.module.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/app.module.ts), [auth.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth.controller.ts), [attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/attendance.controller.ts), [admin-attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/admin-attendance.controller.ts)

## Autentikasi
- Skema: Bearer JWT di header `Authorization`
- Public: `POST /auth/login`, `GET /auth/me` (mengembalikan payload token jika valid; kosong jika tidak)
- Admin-only: `POST /auth/register`, semua `/employees/*`, semua `/admin/attendance/*`
- Employee (JWT wajib): semua `/attendance/*`

Referensi: [JwtAuthGuard](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/auth/jwt-auth.guard.ts), [AdminGuard (attendance)](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/auth/admin.guard.ts), [AdminGuard (auth service)](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/admin.guard.ts)

## Format Error
NestJS default JSON error:
- 400 Bad Request (validasi/bisnis): `{ "statusCode": 400, "message": "email_taken", "error": "Bad Request" }`
- 401 Unauthorized: `{ "statusCode": 401, "message": "Invalid token", "error": "Unauthorized" }`
- 403 Forbidden: `{ "statusCode": 403, "message": "Admin only", "error": "Forbidden" }`
- 404 Not Found: `{ "statusCode": 404, "message": "not_found", "error": "Not Found" }`
- 409 Conflict: `{ "statusCode": 409, "message": "Already checked in", "error": "Conflict" }`
- 503 Service Unavailable: dari health check DB

Gateway meneruskan status + body dari service tanpa mengubah.

## Routes: Auth
Base: `/auth`

- POST `/auth/register` (ADMIN)
  - Body: RegisterDto → `name`, `email`, `password` (min 6), `role?` (`'EMPLOYEE'|'ADMIN'`)
  - Response: user (`id`, `name`, `email`, `role`, `isActive`, `createdAt`)
  - Referensi: [AuthController](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/auth.controller.ts#L12-L16), [RegisterDto](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/dto/register.dto.ts)
  - Contoh request:

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123","role":"ADMIN"}'
```

- POST `/auth/login`
  - Body: LoginDto → `email`, `password` (min 6)
  - Response: `{ "access_token": string }`
  - Referensi: [AuthService.login](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/auth.service.ts#L24-L32), [LoginDto](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/dto/login.dto.ts)
  - Contoh request:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

- GET `/auth/me`
  - Header: `Authorization: Bearer <token>` (opsional)
  - Response: payload token (`sub`, `email`, `role`) atau `{}` jika tidak valid/hilang
  - Referensi: [AuthController.me](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/auth.controller.ts#L23-L34)
  - Contoh request:

```bash
curl http://localhost:8080/auth/me -H "Authorization: Bearer <TOKEN>"
```

## Routes: Employees (ADMIN)
Base: `/employees`

- POST `/employees`
  - Body: CreateEmployeeDto → `name`, `email`, `password`, `isActive?`
  - Response: user EMPLOYEE (`id`, `name`, `email`, `role`, `isActive`, `createdAt`)
  - Referensi: [EmployeesController.create](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.controller.ts#L12-L15), [CreateEmployeeDto](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/dto/create-employee.dto.ts)

- GET `/employees`
  - Query: `search?`, `page?`, `limit?`
  - Response: `{ "items": user[], "page": number, "limit": number, "total": number }`
  - Referensi: [EmployeesController.list](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.controller.ts#L17-L24), [EmployeesService.list](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.service.ts#L26-L49)

- GET `/employees/:id`
  - Response: user EMPLOYEE atau 404
  - Referensi: [EmployeesController.get](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.controller.ts#L26-L29)

- PUT `/employees/:id`
  - Body: UpdateEmployeeDto (semua field opsional)
  - Response: user EMPLOYEE terbaru
  - Referensi: [EmployeesController.update](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.controller.ts#L31-L34)

- DELETE `/employees/:id`
  - Query: `hard=true` (hapus permanen) atau default soft-disable (`isActive=false`)
  - Response: user (soft) atau `{ "success": true }` (hard)
  - Referensi: [EmployeesController.remove](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.controller.ts#L36-L39), [EmployeesService.remove](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.service.ts#L81-L94)

Contoh request (membuat employee):

```bash
curl -X POST http://localhost:8080/employees \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com","password":"secret123"}'
```

## Routes: Attendance (Employee JWT)
Base: `/attendance`

- POST `/attendance/check-in`
  - Body (opsional): `{ "photoUrl"?: URL, "description"?: string (≤500) }`
  - Response: attendance created (`id`, `userId`, `date`, `checkIn`, `status`, `photoUrl?`, `description?`)
  - Referensi: [AttendanceController.checkIn](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/attendance.controller.ts#L12-L16), [CheckInDto](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/dto/check-in.dto.ts)

- POST `/attendance/check-out`
  - Body (opsional): `{ "description"?: string (≤500) }`
  - Response: attendance updated (field `checkOut` terisi)
  - Referensi: [AttendanceController.checkOut](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/attendance.controller.ts#L18-L22)

- GET `/attendance/me`
  - Query: `from?`, `to?` (ISO date), `page?` (default 1), `pageSize?` (default 20)
  - Response: `{ "items": attendance[], "page": number, "pageSize": number, "total": number }`
  - Referensi: [AttendanceController.me](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/attendance.controller.ts#L24-L37)

Contoh request (check-in):

```bash
curl -X POST http://localhost:8080/attendance/check-in \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"photoUrl":"https://example.com/p.jpg","description":"Datang"}'
```

## Routes: Admin Attendance (ADMIN)
Base: `/admin/attendance`

- GET `/admin/attendance`
  - Query: `userId?`, `from?`, `to?`, `page?`, `pageSize?`
  - Response: history (`items`, `page`, `pageSize`, `total`). Jika `userId` ada → hanya user tsb.
  - Referensi: [AdminAttendanceController.list](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/admin.controller.ts#L11-L25)

- GET `/admin/attendance/today`
  - Query: `page?`, `pageSize?` (default 50)
  - Response: `{ "items": attendance[], "page": number, "pageSize": number, "total": number }`
  - Referensi: [AdminAttendanceController.today](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/admin.controller.ts#L27-L32)

Contoh request (list semua):

```bash
curl "http://localhost:8080/admin/attendance?page=1&pageSize=50" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## Contoh Penggunaan di Frontend
Simpan token setelah login, gunakan di `Authorization` untuk semua route yang membutuhkan.

Contoh login dan pemanggilan API dengan `fetch`:

```ts
async function login(email: string, password: string) {
  const res = await fetch('http://localhost:8080/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login gagal');
  const { access_token } = await res.json();
  return access_token;
}

async function getMyAttendance(token: string, params?: { from?: string; to?: string; page?: number; pageSize?: number }) {
  const url = new URL('http://localhost:8080/attendance/me');
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) url.searchParams.set(k, String(v)); });
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal mengambil attendance');
  return res.json();
}

async function adminListEmployees(token: string, search?: string) {
  const url = new URL('http://localhost:8080/employees');
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal mengambil employees');
  return res.json();
}
```

## Konfigurasi & Catatan
- API Gateway env: `PORT` (default 8080), `AUTH_SERVICE_URL` (default `http://localhost:3000`), `ATTENDANCE_SERVICE_URL` (default `http://localhost:3001`)
- Attendance Service env yang memengaruhi logika:
  - `SHIFT_START` (default `'09:00'`), `LATE_GRACE` (menit, default `15`) → status `ON_TIME`/`LATE` saat check-in. Referensi: [AttendanceService](file:///Users/rahoolll/dexa-technical-test/dexa-backend/attendance-service/src/attendance/attendance.service.ts#L23-L33)
- `JWT_SECRET` harus konsisten di semua service untuk verifikasi token.
- Pagination: employees → `page`, `limit`; attendance → `page`, `pageSize`.

