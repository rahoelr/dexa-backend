# CRUD Karyawan oleh Admin — Dokumentasi Lengkap

## Ringkasan
- Peran: hanya Admin yang boleh melakukan operasi CRUD karyawan.
- Semua rute diakses melalui API Gateway pada `http://localhost:8080`.
- Header wajib: `Authorization: Bearer <ADMIN_JWT>`.

## Routing via API Gateway
- `POST /employees` — buat karyawan baru.
- `GET /employees?search=<q>&page=<n>&limit=<m>` — daftar karyawan dengan pencarian dan paginasi.
- `GET /employees/:id` — detail karyawan.
- `PUT /employees/:id` — update karyawan (parsial).
- `DELETE /employees/:id` — nonaktifkan karyawan (soft delete).
- `DELETE /employees/:id?hard=true` — hapus permanen.

## Validasi Payload
- Create: name:string, email:email, password:minLength 6, isActive?:boolean — lihat [create-employee.dto.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/dto/create-employee.dto.ts#L3-L16)
- Update: semua opsional (name, email, password:minLength 6, isActive:boolean) — lihat [update-employee.dto.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/dto/update-employee.dto.ts#L3-L19)

## Endpoint Detail & Contoh
### Buat Karyawan — `POST /employees`
- Header:
  - `Authorization: Bearer <ADMIN_JWT>`
  - `Content-Type: application/json`
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

- Error:

```json
{ "statusCode": 400, "message": "email_taken", "error": "Bad Request" }
```

- Contoh curl:

```bash
curl -X POST http://localhost:8080/employees \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123","isActive":true}'
```

### Daftar Karyawan — `GET /employees`
- Header:
  - `Authorization: Bearer <ADMIN_JWT>`
- Query opsional: `search`, `page`, `limit`
- Response 200:

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

- Contoh curl:

```bash
curl "http://localhost:8080/employees?search=alice&page=1&limit=10" \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

### Detail Karyawan — `GET /employees/:id`
- Header:
  - `Authorization: Bearer <ADMIN_JWT>`
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

- Error:

```json
{ "statusCode": 404, "message": "not_found", "error": "Not Found" }
```

- Contoh curl:

```bash
curl http://localhost:8080/employees/2 \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

### Update Karyawan — `PUT /employees/:id`
- Header:
  - `Authorization: Bearer <ADMIN_JWT>`
  - `Content-Type: application/json`
- Request (opsional semua field):

```json
{
  "name": "Alice A.",
  "email": "alice.a@example.com",
  "password": "secret456",
  "isActive": false
}
```

- Response 200:

```json
{
  "id": 2,
  "name": "Alice A.",
  "email": "alice.a@example.com",
  "role": "EMPLOYEE",
  "isActive": false,
  "createdAt": "2025-12-30T18:56:45.690Z"
}
```

- Error (email duplikat):

```json
{ "statusCode": 400, "message": "email_taken", "error": "Bad Request" }
```

- Contoh curl:

```bash
curl -X PUT http://localhost:8080/employees/2 \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice A.","email":"alice.a@example.com","password":"secret456","isActive":false}'
```

### Nonaktifkan (Soft Delete) — `DELETE /employees/:id`
- Header:
  - `Authorization: Bearer <ADMIN_JWT>`
- Response 200:

```json
{
  "id": 2,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "EMPLOYEE",
  "isActive": false,
  "createdAt": "2025-12-30T18:56:45.690Z"
}
```

- Contoh curl:

```bash
curl -X DELETE http://localhost:8080/employees/2 \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

### Hapus Permanen — `DELETE /employees/:id?hard=true`
- Header:
  - `Authorization: Bearer <ADMIN_JWT>`
- Response 200:

```json
{ "success": true }
```

- Contoh curl:

```bash
curl -X DELETE "http://localhost:8080/employees/2?hard=true" \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

## Error Umum
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

## Keamanan \& Catatan
- Jangan menyimpan atau menampilkan password di log/UI; kirim hanya saat create/update.
- Token JWT harus valid dengan payload role ADMIN; guard aktif di Gateway \& Service.

## Referensi Kode
- Controller Employees: [employees.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.controller.ts#L7-L39)
- Service Employees: [employees.service.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/employees.service.ts#L9-L95)
- DTO Create/Update: [create-employee.dto.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/dto/create-employee.dto.ts#L3-L16), [update-employee.dto.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/auth-user-service/src/employees/dto/update-employee.dto.ts#L3-L19)
- Gateway Routing \& Guard: [api-gateway/src/auth.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth.controller.ts#L45-L63), [admin-gateway.guard.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth/admin-gateway.guard.ts#L4-L23)

## Terkait
- UI Flow Dashboard Admin: [ui-flow-dashboard-admin.md](file:///Users/rahoolll/dexa-technical-test/dexa-backend/docs/ui-flow-dashboard-admin.md)
- Dokumentasi API Gateway: [api-gateway.md](file:///Users/rahoolll/dexa-technical-test/dexa-backend/docs/api-gateway.md)

