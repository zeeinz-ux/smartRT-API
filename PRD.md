# smartRT-API — Product Requirements Document

## 1. Overview

Aplikasi manajemen RT berbasis web untuk RT 003. Mencakup manajemen warga, iuran sampah bulanan, iuran qurban tahunan, pencatatan pemasukan & pengeluaran, serta integrasi Google Sheets untuk backup data.

---

## 2. Alur Login

### 2.1. Halaman Login

- Input: **Email** + **Password** + **Pilih Role**
- Validasi: Email & password cocok, role yang dipilih harus sesuai dengan role user di database
- Jika user tidak memiliki profile (`warga_profiles`) → `requiresOnboarding: true`
  - Setelah login, redirect ke halaman `/onboarding`
- Jika user sudah punya profile → `requiresOnboarding: false`
  - Redirect ke dashboard sesuai role (`/admin/dashboard`, `/bendahara/dashboard`, `/warga/dashboard`)

### 2.2. Sesi & Auth

- **Session-based** (bukan JWT) — menggunakan `@adonisjs/auth` dengan `sessionGuard`
- `rememberMeTokens: false` — tidak ada fitur "Stay Logged In"
- Login: `auth.login(user)` tanpa argumen remember

### 2.3. Middleware

- Semua route `/api/*` (kecuali login) dilindungi oleh `middleware.auth()`
- Route admin/bendahara juga dicek role di controller
- Frontend: `ProtectedRoute` component wrapper sesuai role

### 2.4. Onboarding Flow

1. Admin membuat akun warga (nama, email, no_hp, password, role) → status `pending`
2. Warga login → redirect ke `/onboarding`
3. Warga mengisi form lengkap (NIK, KK, alamat, no_rumah, status_huni, upload foto KK)
4. Admin verifikasi profile → status berubah jadi `verified` atau `rejected`
5. Setelah verified, warga bisa akses fitur penuh

### 2.5. Role System

| Role | Akses | Redirect Post-Login |
|------|-------|---------------------|
| `admin` | Semua fitur: Manajemen Warga, Iuran Sampah, Iuran Qurban, Keuangan, Laporan, Pengumuman, Surat, Darurat, Google Sheets | `/admin/dashboard` |
| `bendahara` | Iuran Sampah, Iuran Qurban, Keuangan, Laporan, Pengumuman, Surat, Darurat (read + resolve) | `/bendahara/dashboard` |
| `warga` | Dashboard sendiri, Tagihan, Laporan, Surat, FAB Darurat (kirim sinyal saja) | `/warga/dashboard` |
| **Semua role** | Pengaturan Akun (ubah password sendiri) | — |

---

## 3. 9 Modul Utama (Sudah Dibangun)

### 3.1. Autentikasi & Login
- Login dengan email + password + pilih role
- Session-based auth (`@adonisjs/auth` sessionGuard)
- Validasi role: role yang dipilih harus sesuai dengan role user di DB
- Cek role setelah login (`/api/auth/check-role`)
- Logout

### 3.2. Onboarding Warga
- Admin membuat akun warga → status `pending`, `requiresOnboarding: true`
- Warga login → redirect ke `/onboarding`
- Form lengkap: NIK, KK, alamat, no_rumah, status_huni
- Validasi NIK/KK 16 digit, NIK ≠ KK
- Admin verifikasi/tolak profile warga
- Status: `pending` → `verified` / `rejected`

### 3.3. Manajemen Warga
- List semua akun (LEFT JOIN users → warga_profiles)
- Filter: role, search (nama/email/NIK)
- Create akun (nama, email, no_hp, password, role)
  - Role `warga` → pending
  - Role `admin`/`bendahara` → active
- Detail modal, Edit, Delete (hard), Deactivate (soft)
- Role column + pending badge

### 3.4. Iuran Sampah
- Pembayaran iuran kebersihan **bulanan**
- Filter: bulan & tahun
- CRUD per warga per bulan
- Stat cards: Total, Lunas, Belum Lunas, Terkumpul
- QRIS payment modal
- Google Sheets sync

### 3.5. Iuran Qurban
- Pembayaran iuran qurban **tahunan** (dengan sub-filter bulan)
- Filter: bulan & tahun
- CRUD per warga per bulan
- Stat cards + QRIS modal
- Google Sheets sync

### 3.6. Keuangan
- Rekap pemasukan (dari Sampah + Qurban) & pengeluaran
- 3 kartu ringkasan: Total Pemasukan, Total Pengeluaran, Saldo
- Mutasi: timeline semua transaksi urut tanggal
- CRUD pengeluaran (nama, jumlah, kategori, tanggal, keterangan)
- Kategori: Operasional, Perawatan, Kebersihan, Kegiatan, Dana Sosial, Lainnya

### 3.7. Google Sheets Integration
- Spreadsheet dengan 3 sheet: Data Warga, Iuran Sampah, Iuran Qurban
- Kolom No: angka sekuensial (001, 002...) dengan UUID di kolom B
- Sync: append warga baru, update/delete via `findRowByUuid`
- Gap reuse: nomor yang dihapus dipakai ulang
- Non-critical: error tidak ganggu request utama

### 3.8. Dukcapil Validator
- NIK: 16 digit angka
- KK: 16 digit angka
- NIK dan KK tidak boleh sama
- Validasi di backend + frontend
- `.toString().trim()` sebelum digunakan

### 3.9. Tombol Darurat (Emergency Alert)
- **FAB (Floating Action Button)**: Tombol merah di pojok kanan bawah, muncul di semua halaman setelah login
- **Semua role** (warga, bendahara, admin) bisa mengirim sinyal darurat via FAB
- **GPS**: Mengambil koordinat lokasi via Geolocation API browser
- **Konfirmasi**: Modal konfirmasi sebelum mengirim, menampilkan koordinat & link Google Maps
- **Status**: `active` → `resolved` (admin/bendahara tandai selesai)
- **Real-time monitoring**: Admin/bendahara bisa lihat daftar sinyal aktif di halaman `/admin/darurat` (polling tiap 5 detik)
- **Toast notifikasi**: Notifikasi muncul saat ada sinyal darurat baru
- **Pembatalan**: Pengirim bisa batalkan sinyal aktif dari FAB

### 3.10. Pengaturan Akun
- **Menu "Pengaturan"** di sidebar semua role (admin, bendahara, warga)
- **Ubah password**: Form dengan current_password, new_password, confirm_password
- **Validasi**: Password baru ≥ 6 karakter, konfirmasi harus cocok, current password harus benar
- **Endpoint**: `PATCH /api/auth/password` (auth required)

---

## 4. Fitur Pendukung

### 3.1. Manajemen Warga (`/admin/warga`)

- **Create**: Admin membuat akun dasar (nama, email, no_hp, password, role)
  - Role `warga` → status `pending` (harus onboarding)
  - Role `admin`/`bendahara` → status `active` langsung
- **List**: Tabel semua users (LEFT JOIN dari `users` ke `warga_profiles`)
  - Menampilkan role, status akun, status verifikasi
  - Pending (belum onboarding) ditandai badge warning
  - Role column menampilkan badge sesuai role
- **Detail**: Modal detail lengkap user + profile (jika ada)
- **Update**: Edit data user & profile
- **Verify/Reject**: Verifikasi atau tolak profile warga
- **Deactivate**: Soft suspend (status → `suspended`)
- **Delete**: Hard delete (hapus user + profile + iuran terkait dari DB & Google Sheets)

### 3.2. Iuran Sampah (`/admin/sampah`, `/bendahara/sampah`)

- Management iuran kebersihan **bulanan** per warga
- Filter: bulan & tahun
- Stat cards: Total Warga, Lunas, Belum Lunas, Terkumpul
- CRUD pembayaran per warga per bulan
- QRIS payment modal

### 3.3. Iuran Qurban (`/admin/kurban`, `/bendahara/kurban`)

- Management iuran qurban **tahunan** (dengan sub-filter bulan)
- Filter: bulan & tahun
- Stat cards: Total Warga, Lunas, Belum Lunas, Terkumpul
- CRUD pembayaran per warga per bulan
- QRIS payment modal

### 3.4. Keuangan (`/admin/keuangan`, `/bendahara/keuangan`)

- Rekap pemasukan & pengeluaran
- Filter: bulan & tahun
- 3 stat cards: Total Pemasukan, Total Pengeluaran, Saldo
- Mutasi: timeline gabungan pemasukan (dari Sampah + Qurban) & pengeluaran
- CRUD pengeluaran (nama, jumlah, kategori, tanggal, keterangan)
- Kategori pengeluaran: Operasional, Perawatan, Kebersihan, Kegiatan, Dana Sosial, Lainnya

### 3.5. Google Sheets Integration

- Spreadsheet ID dari `.env`
- Service account (JSON) untuk autentikasi
- 3 sheet: **Data Warga**, **Iuran Sampah**, **Iuran Qurban**
- Kolom No menggunakan angka sekuensial (001, 002...) dengan UUID di kolom B untuk lookup
  - `RAW` mode untuk preserve leading zeros
  - Gap reuse: nomor yang sudah dihapus dipakai ulang
- Sync: warga baru langsung di-append, update/delete via `findRowByUuid`
- Non-critical: error sync tidak mengganggu request utama

### 3.6. Dukcapil Validator

- NIK: 16 digit angka
- KK: 16 digit angka
- NIK dan KK tidak boleh sama
- Validasi di backend + frontend

### 3.7. Tombol Darurat

- **FAB (Floating Action Button)**: Tombol merah di pojok kanan bawah, muncul di semua halaman setelah login
- **Semua role** bisa kirim sinyal darurat via FAB
- **GPS**: Ambil koordinat lokasi via Geolocation API
- **Modal konfirmasi**: Tampilkan koordinat + link Google Maps sebelum kirim
- **Polling 5 detik**: Halaman monitor admin/bendahara polling sinyal aktif tiap 5 detik
- **Resolve**: Admin/bendahara tandai selesai dari halaman monitor
- **Pembatalan**: Pengirim bisa batalkan sinyal dari FAB
- **Routes API**: `POST /api/darurat`, `GET /api/darurat/active`, `PATCH /api/darurat/:id/resolve`, `GET /api/darurat/saya`

---

## 4. Arsitektur

### 4.1. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | AdonisJS 7 (Node.js) |
| Frontend | React 19 + Vite + TailwindCSS 4 |
| Database | PostgreSQL |
| Auth | Session-based (`@adonisjs/auth`) |
| Sheet | Google Sheets API v4 |

### 4.2. Struktur Database (tables)

- `users` — akun utama (id, nama, email, no_hp, password, role, status)
- `warga_profiles` — data lengkap warga (user_id, nik, kk, alamat, no_rumah, status_huni, foto_kk, verification_status, dll)
- `iuran_sampah` — pembayaran sampah per warga per bulan
- `iuran_qurban` — pembayaran qurban per warga per bulan (dalam tahun)
- `pengeluarans` — catatan pengeluaran kas RT
- `laporans` — laporan warga
- `pengumumans` — pengumuman dari pengurus
- `surat_pengantars` — pengajuan surat pengantar
- `surat_templates` — template PDF surat
- `emergency_alerts` — sinyal darurat warga

### 4.3. Import Aliases (Backend)

Semua path relatif ke `app/`:
- `#controllers/*` → `app/controllers/*`
- `#models/*` → `app/models/*`
- `#services/*` → `app/services/*`
- `#middleware/*` → `app/middleware/*`
- `#config/*` → `config/*`
- `#start/*` → `start/*`
- `#validators/*` → `app/validators/*`
- `#exceptions/*` → `app/exceptions/*`
- `#tests/*` → `tests/*`
- `#database/*` → `database/*`

### 4.4. API Prefix

Semua route di-prefix `/api`

### 4.5. Frontend Routing

```
/login                  → Login page
/onboarding             → Onboarding form (warga baru)
/admin/dashboard        → Admin dashboard
/admin/warga            → Manajemen Warga
/admin/sampah           → Iuran Sampah
/admin/kurban           → Iuran Qurban
/admin/keuangan         → Keuangan
/admin/laporan          → Laporan Warga
/admin/pengumuman       → Pengumuman
/admin/surat            → Surat Pengantar
/admin/darurat          → Monitoring Darurat
/bendahara/dashboard    → Bendahara dashboard
/bendahara/sampah       → Iuran Sampah
/bendahara/kurban       → Iuran Qurban
/bendahara/keuangan     → Keuangan
/warga/dashboard        → Warga dashboard
/warga/laporan          → Laporan Saya
/warga/pengumuman       → Pengumuman
/warga/surat            → Surat Pengantar
/pengaturan             → Pengaturan Akun (semua role)
```

### 4.6. CSS Design System

- **Theme**: Hijau organik
- **Font**: DM Serif Display (heading) + DM Sans (body)
- **CSS Variables**: Semua warna, spacing, radius, shadow konsisten via `:root` variables
- **Tidak** menggunakan CSS-in-JS atau framework UI (Tailwind hanya untuk utility)
- **Responsive breakpoints**: 1024px, 768px, 480px, 360px
- **Column hiding strategy**: Kolom tabel disembunyikan bertahap di breakpoint kecil

### 4.7. State Persistence

- Filter bulan/tahun di halaman Sampah, Qurban, dan Keuangan disimpan ke **localStorage**
  - Key: `usBulan`, `usTahun` (Sampah)
  - Key: `uqBulan`, `uqTahun` (Qurban)
  - Key: `keuBulan`, `keuTahun` (Keuangan)
- Default: bulan & tahun saat ini

---

## 5. Model Data

### Users
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| nama | string | |
| email | string | unique |
| no_hp | string | |
| password | string | hashed via @beforeSave |
| role | enum | admin, bendahara, warga |
| status | enum | active, pending, suspended |
| requiresOnboarding | boolean | true untuk warga baru |

### Warga Profiles
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| nik | string | 16 digit |
| kk | string | 16 digit |
| alamat | text | |
| no_rumah | string | |
| status_huni | enum | pemilik, penyewa |
| foto_kk | string | URL/path |
| verification_status | enum | pending, verified, rejected |
| verified_at | timestamp | |
| verified_by | uuid | FK → users |
| rejected_at | timestamp | |
| alasan_ditolak | text | |

### Iuran Sampah
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| warga_id | uuid | FK → users |
| bulan | integer | 1-12 |
| tahun | integer | |
| jumlah | decimal | |
| status | enum | lunas, belum_lunas, pending |
| metode_pembayaran | enum | tunai, transfer, qris |
| paid_at | timestamp | |
| keterangan | text | |

### Iuran Qurban
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| warga_id | uuid | FK → users |
| bulan | integer | 1-12 |
| tahun | integer | |
| jumlah | decimal | |
| status | enum | lunas, belum_lunas, pending |
| metode_pembayaran | enum | tunai, transfer, qris |
| paid_at | timestamp | |
| keterangan | text | |

### Pengeluarans
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| nama | string | Nama pengeluaran |
| jumlah | decimal | |
| kategori | string | Operasional, Perawatan, dll |
| tanggal | date | |
| keterangan | text | nullable |
| created_by | uuid | FK → users |

### Emergency Alerts
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users (pengirim) |
| latitude | decimal(10,8) | Koordinat GPS |
| longitude | decimal(11,8) | Koordinat GPS |
| keterangan | text | nullable |
| status | enum | active, resolved, cancelled |
| resolved_by | uuid | FK → users (penanggap), nullable |
| resolved_at | timestamp | nullable |

---

## 6. Catatan Penting

- `JWT_SECRET` di `.env` **tidak dipakai** — auth pakai session
- Node.js >= 24 required
- Semua path file di backend relatif ke direktori `backend/`
- Google Sheets sync non-critical (error dicatch silent)
- Password hashing otomatis via `@beforeSave` — jangan hash manual
- NIK/KK: selalu `.toString().trim()`, validasi 16 digit
- Dua tsconfig: root `tsconfig.json` + `tsconfig.inertia.json`
