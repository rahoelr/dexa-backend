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

## Contoh Request/Response
- Cek forwarding ke Attendance (tanpa token akan 401 oleh guard):

```bash
curl -i http://localhost:8080/attendance
```

- Cek forwarding ke Auth (route root biasanya 404 jika tidak didefinisikan di service):

```bash
curl -i http://localhost:8080/auth
```

- Contoh akses Employees dengan Admin:

```bash
curl -i \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  http://localhost:8080/employees
```

## Troubleshooting Cepat
- 503 dari Gateway: upstream tidak tersedia atau timeout; pastikan service target berjalan di port yang benar.
- 401 dari Gateway: token bearer hilang/invalid; pastikan header Authorization benar.
- 403 di Employees: token tidak memiliki role ADMIN.

