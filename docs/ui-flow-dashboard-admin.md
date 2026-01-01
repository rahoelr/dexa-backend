# Dokumentasi UI Flow — Dashboard Admin (Manajemen Register Karyawan)

## Tujuan
- Menyediakan panduan UI dan API untuk Admin dalam mengelola karyawan: buat, lihat, ubah, nonaktifkan, hapus permanen.
- Semua operasi karyawan dilindungi role ADMIN melalui API Gateway.

## Arsitektur & Routing
- Base URL Gateway: http://localhost:8080
- Pemetaan layanan:
  - `/auth/*` → Auth User Service: lihat [auth.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth.controller.ts#L10-L43)
  - `/employees/*` → Auth User Service (ADMIN): lihat [auth.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth.controller.ts#L45-L63)
- Guard:
  - Gateway: AdminGatewayGuard [admin-gateway.guard.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth/admin-gateway.guard.ts#L4-L23)
  - Service: AdminGuard [admin.guard.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/admin.guard.ts#L4-L23)

## Alur UI Dashboard Admin
- Login Admin
  - Form email dan password → POST `/auth/login` → simpan `access_token` JWT.
  - Redirect ke halaman Dashboard Admin.
- Dashboard Overview
  - Tampilkan ringkas: jumlah karyawan aktif, karyawan terbaru.
  - Navigasi ke Manajemen Karyawan.
- Manajemen Karyawan — Daftar
  - Tabel daftar karyawan.
  - Pencarian berdasarkan nama/email, paginasi.
  - Aksi pada baris: Detail, Edit, Nonaktifkan, Hapus Permanen.
  - Tombol “Tambah Karyawan”.
- Tambah Karyawan
  - Form: `name`, `email`, `password`, `isActive` (opsional, default true).
  - Kirim POST `/employees`.
- Detail & Edit Karyawan
  - GET `/employees/:id` untuk memuat detail.
  - PUT `/employees/:id` untuk update sebagian (nama, email, password, isActive).
- Nonaktifkan/Hapus
  - Nonaktifkan (soft delete): DELETE `/employees/:id` → `isActive=false`.
  - Hapus permanen: DELETE `/employees/:id?hard=true`.
- Penanganan Error
  - 401 → redirect login.
  - 403 → tampilkan “Admin only”.
  - 400 `email_taken`/validasi → tampilkan pesan field.
  - 404 `not_found` → tampilkan “Data tidak ditemukan”.

## Spesifikasi API — Auth (melalui Gateway)
### Login
- Endpoint: `POST /auth/login`
- Request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

- Response 200:

```json
{
  "access_token": "<JWT>"
}
```

### Register via Admin (opsional untuk membuat akun ADMIN/EMPLOYEE)
- Endpoint: `POST /auth/register`
- Header: `Authorization: Bearer <ADMIN_JWT>`
- Request:

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "EMPLOYEE"
}
```

- Response 201:

```json
{
  "id": 2,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "EMPLOYEE",
  "isActive": true,
  "createdAt": "2025-12-30T18:56:45.690Z"
}
```

## Spesifikasi API — Employees (melalui Gateway)
### Buat Karyawan
- Endpoint: `POST /employees`
- Header: `Authorization: Bearer <ADMIN_JWT>`
- Validasi payload: lihat [create-employee.dto.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/dto/create-employee.dto.ts#L3-L16)
- Request:

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "isActive": true
}
```

- Response 201:

```json
{
  "id": 2,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "EMPLOYEE",
  "isActive": true,
  "createdAt": "2025-12-30T18:56:45.690Z"
}
```

### Daftar Karyawan (pencarian & paginasi)
- Endpoint: `GET /employees?search=<q>&page=<n>&limit=<m>`
- Header: `Authorization: Bearer <ADMIN_JWT>`
- Response 200 (lihat [employees.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.service.ts#L26-L49)):

```json
{
  "items": [
    { "id": 2, "name": "Alice", "email": "alice@example.com", "role": "EMPLOYEE", "isActive": true, "createdAt": "2025-12-30T18:56:45.690Z" }
  ],
  "page": 1,
  "limit": 10,
  "total": 1
}
```

### Detail Karyawan
- Endpoint: `GET /employees/:id`
- Response 200:

```json
{
  "id": 2,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "EMPLOYEE",
  "isActive": true,
  "createdAt": "2025-12-30T18:56:45.690Z"
}
```

### Update Karyawan
- Endpoint: `PUT /employees/:id`
- Validasi payload: lihat [update-employee.dto.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/dto/update-employee.dto.ts#L3-L19)
- Request (opsional semua field):

```json
{
  "name": "Alice A.",
  "email": "alice.a@example.com",
  "password": "secret456",
  "isActive": false
}
```

- Response 200: sama seperti detail.

### Nonaktifkan Karyawan (soft delete)
- Endpoint: `DELETE /employees/:id`
- Response 200: objek karyawan dengan `isActive=false`.

### Hapus Permanen
- Endpoint: `DELETE /employees/:id?hard=true`
- Response 200:

```json
{ "success": true }
```

### Error Umum
- 401 Unauthorized:

```json
{ "statusCode": 401, "message": "Unauthorized", "error": "Unauthorized" }
```

- 403 Admin only:

```json
{ "statusCode": 403, "message": "Admin only", "error": "Forbidden" }
```

- 400 email_taken:

```json
{ "statusCode": 400, "message": "email_taken", "error": "Bad Request" }
```

- 404 not_found:

```json
{ "statusCode": 404, "message": "not_found", "error": "Not Found" }
```

## Routing Frontend (Saran)
- `/admin/login` → halaman login admin.
- `/admin` → overview ringkas.
- `/admin/employees` → daftar karyawan (+ search, paginasi).
- `/admin/employees/new` → form tambah karyawan.
- `/admin/employees/:id` → detail karyawan.
- `/admin/employees/:id/edit` → edit karyawan.
- Guard Frontend: pastikan JWT + role ADMIN; redirect ke `/admin/login` bila tidak valid.

## Keamanan & Validasi
- Validasi field sesuai DTO (password min 6, email format benar).
- Kirim password hanya saat register/update; jangan log di client.
- Token JWT wajib dan harus memiliki role ADMIN; guard aktif di Gateway & Service.

## Referensi Kode
- Controller Employees (service): [employees.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.controller.ts#L7-L39)
- Service Employees (response & logika): [employees.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.service.ts#L9-L95)
- DTO Create/Update: [create-employee.dto.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/dto/create-employee.dto.ts#L3-L16), [update-employee.dto.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/dto/update-employee.dto.ts#L3-L19)
- Auth Register/Login: [auth.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/auth.controller.ts#L12-L35), [auth.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/auth/auth.service.ts#L12-L32)
- Gateway Routing: [api-gateway/src/auth.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth.controller.ts#L10-L63)

