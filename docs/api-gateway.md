# Dokumentasi API Gateway

## Tujuan
- Menyederhanakan akses ke beberapa service melalui satu endpoint.
- Meneruskan request ke service yang tepat dan mengembalikan response apa adanya.
- Menerapkan guard di Gateway untuk memastikan keamanan dasar (JWT, peran Admin).

## Konfigurasi
- Base URL downstream diatur via environment:
  - AUTH_SERVICE_URL dan ATTENDANCE_SERVICE_URL dibaca oleh Gateway: lihat [config.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/config.service.ts#L8-L16)
  - Default fallback: auth http://localhost:3000, attendance http://localhost:3001
- JWT_SECRET digunakan untuk verifikasi token di guard: lihat [config.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/config.service.ts#L17-L20)
- Timeout forward dapat diatur via GATEWAY_TIMEOUT_MS (default 15000 ms): [config.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/config.service.ts#L14-L16)
- Compose root mengarahkan Gateway ke host.docker.internal:PORT agar tidak memakai Docker network: [docker-compose.yml](file:///Users/rahoolll/dexa-technical-test/dexa-backend/docker-compose.yml#L69-L78)

## Routing
- Auth
  - Endpoint Gateway: `/auth` → diteruskan ke `${AUTH_SERVICE_URL}/auth`
  - Controller: [auth.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth.controller.ts#L10-L43)
  - Khusus `/auth/register`: wajib token dengan role ADMIN (divalidasi di Gateway sebelum forward).
- Employees (subset dari Auth Service)
  - Endpoint Gateway: `/employees` → diteruskan ke `${AUTH_SERVICE_URL}/employees`
  - Guard: AdminGatewayGuard (wajib role ADMIN): [admin-gateway.guard.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth/admin-gateway.guard.ts#L5-L23)
- Attendance
  - Endpoint Gateway: `/attendance` → diteruskan ke `${ATTENDANCE_SERVICE_URL}/attendance`
  - Guard: JwtGatewayGuard (wajib Bearer token valid): [jwt-gateway.guard.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth/jwt-gateway.guard.ts#L5-L22)
  - Controller: [attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/attendance.controller.ts#L9-L27)

## Perilaku Forwarding
- Metode, path, query, dan body diteruskan apa adanya: [proxy.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/proxy.service.ts#L37-L46)
- Header hop-by-hop disaring; Gateway menambahkan header `x-forwarded-*`: [proxy.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/proxy.service.ts#L6-L16) dan [proxy.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/proxy.service.ts#L31-L35)
- Response dari service (status + body + sebagian header) dikembalikan langsung: [proxy.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/proxy.service.ts#L47-L53)
- Jika upstream gagal/timeout: Gateway mengembalikan 503 JSON: [proxy.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/proxy.service.ts#L52-L61)

## Autentikasi di Gateway
- Bearer token wajib untuk rute yang dilindungi:
  - Attendance: token valid, payload berisi userId/id/sub
  - Employees: token valid, role ADMIN
- Contoh header:

```http
Authorization: Bearer <JWT>
```

## Cara Menjalankan (Root)
- Prasyarat: Docker Desktop (macOS) dengan dukungan `host.docker.internal`
- Jalankan dari root backend:

```bash
docker compose up -d
```

- Port layanan:
  - Api Gateway: http://localhost:8080
  - Auth Service: http://localhost:3000
  - Attendance Service: http://localhost:3001
  - MySQL Auth: localhost:3307
  - MySQL Attendance: localhost:3308

- Konfigurasi penting di root compose:
  - Gateway diarahkan ke host.docker.internal: [docker-compose.yml](file:///Users/rahoolll/dexa-technical-test/dexa-backend/docker-compose.yml#L69-L78)
  - DATABASE_URL service pakai host.docker.internal + port yang dipublish: [docker-compose.yml](file:///Users/rahoolll/dexa-technical-test/dexa-backend/docker-compose.yml#L36-L64)

## Menjalankan Api Gateway Saja
- Jika service downstream berjalan di host pada port default (3000/3001), Gateway bisa berjalan sendiri:
  - Env contoh: [api-gateway/.env.example](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/.env.example)
  - Jalankan dengan compose per-folder:

```bash
cd api-gateway
docker compose up -d
```

- Atau jalankan tanpa Docker (Node.js):

```bash
cd api-gateway
npm install
npm run start:prod
```

## Routing Ringkas
- `/auth/*` → `${AUTH_SERVICE_URL}/auth/*`
- `/employees/*` → `${AUTH_SERVICE_URL}/employees/*` (ADMIN)
- `/attendance/*` → `${ATTENDANCE_SERVICE_URL}/attendance/*` (JWT)

## Contoh Request/Response (JSON)
- Auth — Login

```http
POST /auth/login
Content-Type: application/json
```

```json
// Request
{
  "email": "admin@example.com",
  "password": "password"
}
```

```json
// Response 200
{
  "access_token": "<JWT>"
}
```

```json
// Response 401
{
  "statusCode": 401,
  "message": "invalid_credentials",
  "error": "Unauthorized"
}
```

- Auth — Register (ADMIN)

```http
POST /auth/register
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json
```

```json
// Request
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "EMPLOYEE"
}
```

```json
// Response 201
{
  "id": 2,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "EMPLOYEE",
  "isActive": true,
  "createdAt": "2025-12-30T18:56:45.690Z"
}
```

```json
// Response 400 (email sudah dipakai)
{
  "statusCode": 400,
  "message": "email_taken",
  "error": "Bad Request"
}
```

```json
// Response 401/403 (bukan ADMIN atau token invalid)
{
  "statusCode": 403,
  "message": "Admin only",
  "error": "Forbidden"
}
```

- Auth — Me

```http
GET /auth/me
Authorization: Bearer <JWT>
```

```json
// Response 200
{
  "sub": 2,
  "email": "alice@example.com",
  "role": "EMPLOYEE",
  "iat": 1767121010,
  "exp": 1767207410
}
```

- Employees (ADMIN)

```http
GET /employees
Authorization: Bearer <ADMIN_JWT>
```

```json
// Response 200 (contoh bentuk umum)
[
  { "id": 1, "name": "Admin", "email": "admin@example.com", "role": "ADMIN" },
  { "id": 2, "name": "Alice", "email": "alice@example.com", "role": "EMPLOYEE" }
]
```

```json
// Response 403
{
  "statusCode": 403,
  "message": "Admin only",
  "error": "Forbidden"
}
```

- Attendance — Check-in (JWT)

```http
POST /attendance/check-in
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
// Request (opsional)
{
  "photoUrl": "https://example.com/p.jpg",
  "description": "Datang"
}
```

```json
// Response 200
{
  "id": 10,
  "userId": 2,
  "date": "2025-12-30T00:00:00.000Z",
  "checkIn": "2025-12-30T09:01:02.345Z",
  "checkOut": null,
  "photoUrl": "https://example.com/p.jpg",
  "status": "ON_TIME",
  "description": "Datang",
  "createdAt": "2025-12-30T09:01:02.345Z"
}
```

```json
// Response 409 (sudah check-in)
{
  "statusCode": 409,
  "message": "Already checked in",
  "error": "Conflict"
}
```

- Attendance — Check-out (JWT)

```http
POST /attendance/check-out
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
// Request (opsional)
{
  "description": "Pulang"
}
```

```json
// Response 200
{
  "id": 10,
  "userId": 2,
  "date": "2025-12-30T00:00:00.000Z",
  "checkIn": "2025-12-30T09:01:02.345Z",
  "checkOut": "2025-12-30T17:02:01.123Z",
  "photoUrl": "https://example.com/p.jpg",
  "status": "ON_TIME",
  "description": "Pulang",
  "createdAt": "2025-12-30T09:01:02.345Z"
}
```

```json
// Response 400 (belum check-in)
{
  "statusCode": 400,
  "message": "Not checked in",
  "error": "Bad Request"
}
```

```json
// Response 409 (sudah check-out)
{
  "statusCode": 409,
  "message": "Already checked out",
  "error": "Conflict"
}
```

- Attendance — Riwayat Saya (JWT)

```http
GET /attendance/me?from=2025-12-01&to=2025-12-31&page=1&pageSize=20
Authorization: Bearer <JWT>
```

```json
// Response 200
{
  "items": [
    {
      "id": 10,
      "userId": 2,
      "date": "2025-12-30T00:00:00.000Z",
      "checkIn": "2025-12-30T09:01:02.345Z",
      "checkOut": "2025-12-30T17:02:01.123Z",
      "photoUrl": "https://example.com/p.jpg",
      "status": "ON_TIME",
      "description": "Pulang",
      "createdAt": "2025-12-30T09:01:02.345Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

- Kesalahan Upstream (503 dari Gateway)

```json
{
  "statusCode": 503,
  "message": "Upstream unavailable",
  "error": "Service Unavailable",
  "code": "ETIMEDOUT",
  "upstream": "http://host.docker.internal:3000/auth/login"
}
```

## Troubleshooting Cepat
- 503 dari Gateway: upstream tidak tersedia atau timeout; pastikan service target berjalan di port yang benar.
- 401 dari Gateway: token bearer hilang/invalid; pastikan header Authorization benar.
- 403 di Employees: token tidak memiliki role ADMIN.
