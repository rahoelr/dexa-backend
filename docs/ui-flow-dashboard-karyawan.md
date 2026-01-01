# Flow UI Dashboard Karyawan

## Tujuan
- Memfasilitasi karyawan untuk melakukan check-in, check-out, dan melihat riwayat absensi.
- Menyajikan status absensi hari ini dengan aksi yang sesuai.

## Peran
- EMPLOYEE: akses ke rute Attendance melalui Api Gateway dengan JWT.

## Halaman & Komponen
- Header: ringkasan nama karyawan dan tombol logout.
- Kartu Status Hari Ini:
  - Menampilkan apakah sudah check-in/checkout.
  - Tombol Check-in jika belum check-in.
  - Tombol Check-out jika sudah check-in namun belum check-out.
- Riwayat Absensi:
  - Tabel/daftar dengan kolom tanggal, check-in, check-out, status, deskripsi.
  - Filter tanggal (start–end) dan pagination.
- Notifikasi:
  - Toast/snakebar untuk sukses/gagal.
  - Dialog konfirmasi opsional untuk check-out.

## Alur Data
- Pada mount:
  - Panggil `GET /auth/me` untuk memvalidasi dan memuat identitas pengguna.
  - Panggil `GET /attendance/me?from=<today>&to=<today>` untuk status hari ini.
  - Panggil `GET /attendance/me?from=<start>&to=<end>&page=1&pageSize=20` untuk riwayat awal.
- Aksi Check-in:
  - Kirim `POST /attendance/check-in` dengan `photoUrl?` dan `description?`.
  - Setelah sukses: refresh status hari ini dan prepend item pada riwayat.
- Aksi Check-out:
  - Kirim `POST /attendance/check-out` dengan `description?`.
  - Setelah sukses: refresh status hari ini dan update item riwayat hari ini.
- Pagination/Filter:
  - Ubah query `page`, `pageSize`, `from`, `to` lalu reload riwayat.

## State & Error Handling
- Loading state terpisah untuk status hari ini dan riwayat.
- Empty state jika tidak ada riwayat pada rentang filter.
- Error:
  - 401: arahkan ke halaman login, hapus token.
  - 409 ketika check-in: tampilkan pesan “Anda sudah check-in hari ini”.
  - 400 ketika check-out: tampilkan pesan “Anda belum check-in”.
  - 503: tampilkan toast “Layanan tidak tersedia, coba lagi.”

## Contoh Payload

```json
// POST /attendance/check-in
{
  "photoUrl": "https://example.com/p.jpg",
  "description": "Datang"
}
```

```json
// POST /attendance/check-out
{
  "description": "Pulang"
}
```

## Referensi API
- Gateway Attendance: [attendance.controller.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/attendance.controller.ts#L9-L27)
- Guard JWT: [jwt-gateway.guard.ts](file:///Users/rahoolll/dexa-technical-test/dexa-backend/api-gateway/src/auth/jwt-gateway.guard.ts#L5-L22)

