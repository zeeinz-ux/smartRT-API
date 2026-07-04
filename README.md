# SmartRT API

Sistem manajemen RT/RW berbasis web untuk RT 003 — mencakup manajemen warga, iuran sampah bulanan, iuran qurban tahunan, keuangan, pengumuman, surat pengantar, laporan warga, tombol darurat (emergency alert), serta integrasi Google Sheets untuk backup data.

---

## Tech Stack

### Backend
- **AdonisJS 7** — Framework Node.js full-stack
- **TypeScript**
- **PostgreSQL** — Database utama
- **Session-based Auth** — `@adonisjs/auth` dengan `sessionGuard`
- **Google Sheets API v4** — Backup data warga & iuran
- **Edge Templates** — Untuk rendering PDF surat

### Frontend
- **React 19** — UI Library
- **Vite** — Build tool
- **TailwindCSS 4** — Utility-first CSS
- **React Router DOM** — Client-side routing
- **Heroicons** + **React Icons** — Ikon
- **Axios** — HTTP client

---

## Struktur Project

```text
smartRT-API
│
├── backend/
│   ├── app/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # Lucid models (ORM)
│   │   ├── services/       # Business logic (Google Sheets, dll)
│   │   ├── middleware/     # Auth & role middleware
│   │   └── validators/     # Request validation
│   ├── config/             # Konfigurasi aplikasi
│   ├── database/
│   │   ├── migrations/     # Database migrations
│   │   └── schema.ts       # Schema definition
│   ├── start/              # Routes, hooks, env
│   ├── tests/              # Unit, functional, browser tests
│   └── resources/          # Edge templates (PDF surat)
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios instance & interceptors
│   │   ├── assets/         # CSS styles
│   │   ├── components/     # Shared components (Layout, FAB, dll)
│   │   ├── pages/          # Halaman per role (admin, bendahara, warga, auth)
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
│
├── PRD.md                  # Product Requirements Document
├── AGENTS.md               # Development instructions
└── README.md
```

---

## Fitur Utama

### 1. Autentikasi & Role-Based Access
- Login dengan **email + password + pilih role**
- Session-based authentication
- Tiga role: `admin`, `bendahara`, `warga`
- Onboarding flow untuk warga baru

### 2. Manajemen Warga (Admin)
- CRUD akun warga
- Verifikasi profile warga (NIK, KK, alamat, status huni)
- Filter, search, sort
- Aktif/nonaktifkan akun

### 3. Iuran Sampah (Bulanan)
- Pencatatan pembayaran iuran kebersihan per warga per bulan
- Filter bulan & tahun
- Stat cards: Total, Lunas, Belum Lunas, Terkumpul
- Modal pembayaran QRIS

### 4. Iuran Qurban (Tahunan)
- Pencatatan pembayaran iuran qurban per warga
- Sub-filter bulan dalam tahun berjalan
- Stat cards + QRIS payment modal

### 5. Keuangan
- Rekap pemasukan (dari Sampah + Qurban) & pengeluaran
- Ringkasan: Total Pemasukan, Total Pengeluaran, Saldo
- Mutasi timeline transaksi
- CRUD pengeluaran (kategori: Operasional, Perawatan, Kebersihan, Kegiatan, Dana Sosial, Lainnya)

### 6. Pengumuman
- Admin/bendahara membuat pengumuman
- Warga melihat daftar pengumuman

### 7. Surat Pengantar
- Warga mengajukan surat pengantar
- Template PDF untuk berbagai jenis surat
- Admin/bendahara memproses & menerbitkan surat

### 8. Laporan Warga
- Warga mengirim laporan (keluhan, saran, dll)
- Admin/bendahara merespon laporan

### 9. Tombol Darurat (Emergency Alert)
- **FAB** merah di pojok kanan bawah (semua halaman, semua role)
- Mengirim koordinat GPS via Geolocation API
- Modal konfirmasi dengan link Google Maps
- Admin/bendahara memonitor & meresolve sinyal (polling 5 detik)
- Pengirim bisa membatalkan sinyal aktif

### 10. Pengaturan Akun
- Ubah password sendiri (semua role)

### 11. Google Sheets Integration
- Backup data ke 3 sheet: **Data Warga**, **Iuran Sampah**, **Iuran Qurban**
- Sync otomatis (non-critical — error tidak ganggu request utama)
- Service account authentication

---

## Routing

| Route | Halaman | Akses |
|-------|---------|-------|
| `/login` | Login | Publik |
| `/onboarding` | Form onboarding warga | Warga (pending) |
| `/admin/dashboard` | Dashboard admin | Admin |
| `/admin/warga` | Manajemen warga | Admin |
| `/admin/sampah` | Iuran sampah | Admin, Bendahara |
| `/admin/kurban` | Iuran qurban | Admin, Bendahara |
| `/admin/keuangan` | Keuangan | Admin, Bendahara |
| `/admin/laporan` | Laporan warga | Admin |
| `/admin/pengumuman` | Pengumuman | Admin, Bendahara |
| `/admin/surat` | Surat pengantar | Admin, Bendahara |
| `/admin/darurat` | Monitoring darurat | Admin, Bendahara |
| `/bendahara/dashboard` | Dashboard bendahara | Bendahara |
| `/warga/dashboard` | Dashboard warga | Warga |
| `/warga/laporan` | Laporan saya | Warga |
| `/warga/pengumuman` | Pengumuman | Warga |
| `/warga/surat` | Surat pengantar | Warga |
| `/pengaturan` | Pengaturan akun | Semua role |

---

## Instalasi

### Prerequisites
- **Node.js >= 24**
- **PostgreSQL**
- **npm**

### Clone & Setup

```bash
git clone <repository-url>
cd smartRT-API

# Backend
cd backend
npm install
cp .env.example .env
# Konfigurasi database PostgreSQL di .env
node ace migration:run
npm run dev
# Backend berjalan di http://localhost:3333

# Frontend (terminal terpisah)
cd frontend
npm install
# Buat file .env (lihat .env.example)
npm run dev
# Frontend berjalan di http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=3333
HOST=0.0.0.0
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_DATABASE=smart_rt

SESSION_DRIVER=cookie
SESSION_DOMAIN=

GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

APP_URL=http://localhost:3333
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3333
```

---

## Scripts

### Backend (`backend/`)
| Script | Fungsi |
|--------|--------|
| `npm run dev` | Dev server (HMR) |
| `npm run build` | Production build |
| `npm run test` | Jalankan test (Japa) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier --write |
| `npm run typecheck` | TypeScript type check |
| `node ace migration:run` | Run migrations |
| `node ace migration:rollback` | Rollback migrations |

### Frontend (`frontend/`)
| Script | Fungsi |
|--------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

---

## Catatan Penting

- **Session-based auth** (bukan JWT) — `JWT_SECRET` di `.env` tidak dipakai
- **Password hashing** otomatis via `@beforeSave()` hook — jangan hash manual
- **NIK/KK** validasi 16 digit angka, selalu `.toString().trim()` sebelum digunakan
- **Google Sheets sync** non-critical — error dicatch silent
- Semua path file backend relatif ke direktori `backend/`
- Dua tsconfig: `tsconfig.json` (root) + `tsconfig.inertia.json` (Inertia page types)

---

## Author

Developed by zeeinz
