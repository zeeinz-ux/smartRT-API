# smartRT-API — Roadmap Perbaikan & Pengembangan

> Evaluasi menyeluruh berdasarkan kode aktual per Juli 2026.
> Setiap phase diurutkan dari yang paling **safe & impactful** ke yang paling **heavy**.

---

## Phase 0: Housekeeping (Dependency & Config)

**Goal:** Bersihin dead code & sinkronin toolchain biar gak ada tech debt dari awal.

| Task | Detail | File |
|------|--------|------|
| Hapus dead dependencies backend | `@inertiajs/react`, `jsonwebtoken`, `@types/jsonwebtoken`, `firebase`, `cuid`, `@tuyau/core` — gak dipake di kode manapun | `backend/package.json` |
| Hapus dead dependency frontend | `@inertiajs/react` — gak dipake (pake react-router-dom) | `frontend/package.json` |
| Sync Vite frontend dengan backend | Frontend: `vite ^6.0.0` → `^7.3.1`, `@vitejs/plugin-react ^4.7.0` → `^5.1.4` — backend sudah pake Vite 7 | `frontend/package.json` |
| Exception handler → JSON | Masih指向 Inertia error pages, padahal REST API murni | `backend/app/exceptions/handler.ts` |
| Hapus `JWT_SECRET` dari config | Masih required di `env.ts` padahal session-based auth, JWT gak dipake | `backend/config/env.ts` |
| Verify build masih OK | `npm run build` backend + frontend | — |

---

## Phase 1: Foundation (Shared Code & Refactor)

**Goal:** Hapus duplikasi pattern yang bikin maintenance berat.

### Frontend — Shared Utilities

| Task | File Baru |
|------|-----------|
| Extract `rupiah()` — currently duplicated di 4 file | `frontend/src/utils/rupiah.js` |
| Extract `formatDate()` — currently duplicated di 4+ file | `frontend/src/utils/formatDate.js` |
| Extract `BULAN` constant — duplicated di 4 file | `frontend/src/utils/bulan.js` |
| Extract API client — `VITE_API_URL` + `credentials: "include"` di-copy tiap page | `frontend/src/utils/api.js` |
| Update semua page import — ganti inline definitions dengan shared utils | Semua file di `frontend/src/pages/` |

### Backend — Boilerplate Reduction

| Task | Detail | File |
|------|--------|------|
| Base controller pattern | Extract `try { ... } catch (e) { console.error; return 500 }` ke base class atau helper | `backend/app/controllers/base_controller.ts` (new) |
| Google Sheets error handler | Extract `try { sync } catch (e) { console.error('non-critical', e) }` ke satu method | `backend/app/services/google_sheets.ts` |

### Backend — Unify Sampah & Qurban Controller

| Task | Detail |
|------|--------|
| SampahController + QurbanController → IuranController generik | Hampir identik (~250 baris tiap file), beda cuma model + prefix. Bisa jadi satu controller dengan parameter model. |

---

## Phase 2: Type Safety & Validators

**Goal:** Manfaatin TypeScript & VineJS yang udah terinstall tapi gak dipake optimal.

### Fix 19 Instance `any`

| Location | Line | Fix |
|----------|------|-----|
| `backend/app/services/google_sheets.ts` | 8-9 | `auth: any` → typed interface GoogleSheetAuth, `sheets: any` → `sheets_v4.Sheets` |
| `backend/app/controllers/auth_controller.ts` | 82 | `profile: any` → typed dari model, atau `Partial<WargaProfile>` |
| `backend/app/controllers/auth_controller.ts` | 333 | `googleUser: any` → typed Google profile |
| `backend/app/controllers/keuangan_controller.ts` | 29, 48, 100, 106 | `r: any`, `mutasi: any[]` → typed |
| `backend/app/controllers/sampah_controller.ts` | 51 | `w: any` → typed |
| `backend/app/controllers/qurban_controller.ts` | 53 | `w: any` → typed |
| `backend/app/controllers/iuran_controller.ts` | 64, 724, 736, 758-760 | `w: any`, `m: any` → typed |
| `backend/app/controllers/surat_controller.ts` | 11, 295 | `PdfPrinter: any`, `docDefinition: any` → typed |

### Implement VineJS Validators

| Validator File | Untuk |
|----------------|-------|
| `auth_validator.ts` | login, changePassword, verifyPassword |
| `warga_validator.ts` | onboarding, updateProfile |
| `iuran_validator.ts` | store, approve, reject, bayar, generate |
| `admin_validator.ts` | createWarga, updateWarga, verifyWarga, rejectWarga |
| `surat_validator.ts` | store, approve, reject |
| `laporan_validator.ts` | store, update, tanggapi |
| `pengumuman_validator.ts` | store, update |
| `payment_setting_validator.ts` | store, update |

Hapus semua validasi manual inline setelah ada validator.

---

## Phase 3: Frontend Quality

**Goal:** Bikin frontend lebih maintainable & konsisten.

| Task | Detail |
|------|--------|
| Fix dead link "Lupa Password?" | Hapus dari `Login.jsx` atau implementasi endpoint + page |
| Hapus `console.error` dari production | `AdminDashboard.jsx:189`, `ManajemenWarga.jsx:122` |
| Split `ManajemenWarga.jsx` (1081 lines) | → `WargaTable.jsx`, `WargaModal.jsx`, `WargaForm.jsx` |
| Split `AdminDashboard.jsx` (876 lines) | → `StatCards.jsx`, `RecentActivity.jsx`, `ChartSection.jsx` |
| Split `UangSampah.jsx` (712 lines) | → `IuranTable.jsx`, `BayarModal.jsx`, `IuranStats.jsx` |
| Split `UangQurban.jsx` (711 lines) | → Same pattern as Sampah |
| Fix CSS cross-file dependency | `UangQurban.jsx` import `UangSampah.css` — harus import sendiri |
| Inline styles → CSS classes | Pindahin sisa inline styles ke CSS files masing-masing |

---

## Phase 4: Security

**Goal:** Plug celah keamanan dasar.

| Task | Detail |
|------|--------|
| Rate limiting on auth | Middleware di `POST /api/auth/login`, `PATCH /api/auth/password` — misal 5 attempts per 15 menit |
| Enable CSP | `config/shield.ts`: set `Content-Security-Policy` minimal `default-src 'self'` |
| Verify CSRF exemption | `/api/*` di-exclude dari CSRF — pahami risiko, dokumentasi di code |

---

## Phase 5: Test Coverage

**Goal:** Coverage minimal buat flow kritis.

### Functional Tests (Japa, timeout 30s)

| File | Scenario |
|------|----------|
| `tests/functional/auth.spec.ts` | Login success, login wrong password, login wrong role, logout, `GET /api/auth/me`, change password, verify password, RBAC (warga can't access admin routes) |
| `tests/functional/admin_warga.spec.ts` | CRUD warga, verify profile, reject profile, deactivate, delete |
| `tests/functional/sampah.spec.ts` | Create iuran, update, delete, filter by bulan/tahun |
| `tests/functional/qurban.spec.ts` | Create iuran, update, delete, filter |
| `tests/functional/surat.spec.ts` | Ajukan surat, approve, reject, download PDF |
| `tests/functional/darurat.spec.ts` | Kirim sinyal, lihat active, resolve, cancel |
| `tests/functional/laporan.spec.ts` | Buat laporan, update, tanggapi, delete |
| `tests/functional/keuangan.spec.ts` | Rekap, CRUD pengeluaran |

### Unit Tests (timeout 2s)
- Tambah unit test untuk validators (VineJS) setelah implementasi
- Unit test untuk Google Sheets service (mock)

---

## Phase 6: DevOps & Workflow

**Goal:** Standard practices biar tim (atau lo sendiri) bisa kerja lebih rapi.

| Task | Detail |
|------|--------|
| GitHub Actions CI | `.github/workflows/ci.yml`: triggers on push/PR to `main` → `lint` → `typecheck` → `test` |
| Branch strategy | `main` (production) ← `dev` (integration) ← `feature/*` (development) |
| Dependabot | `.github/dependabot.yml`: auto check dependency updates tiap minggu |
| Commit convention | Udah pake `feat:`, `fix:`, `chore:` — pertahankan |

---

## Phase 7: Polish (Nice to Have)

**Goal:** Sentuhan akhir yang bikin project lebih profesional.

| Task | Detail |
|------|--------|
| Google OAuth end-to-end | Test & verify flow atau remove if tidak dipakai |
| Dashboard responsive | CSS breakpoints added/enhanced for AdminDashboard, AdminIuran, ManajemenWarga (768/480/360px). Still has overflow issues on mobile — see `frontend/RESPONSIVE.md` — blocked on finding correct layout approach (row layout caused horizontal overflow on long rupiah strings) |
| Export functionality | Implement export di ManajemenWarga (currently `console.log("Export")` placeholder) |
| Pino structured logging | Ganti `console.error()` di semua controller dengan logger dari AdonisJS |
| Frontend TypeScript | Migrasi bertahap: `.jsx` → `.tsx`, dimulai dari shared utils dulu |

---

## Ringkasan Prioritas

| Phase | Impact | Effort | Recommended Timeline |
|-------|--------|--------|---------------------|
| **0** Housekeeping | 🔴 High | Rendah | Minggu 1 |
| **1** Foundation | 🔴 High | Sedang | Minggu 1-2 |
| **2** Type Safety & Validators | 🟡 Medium | Sedang | Minggu 2-3 |
| **3** Frontend Quality | 🟡 Medium | Tinggi | Minggu 3-4 |
| **4** Security | 🔴 High | Rendah | Minggu 4 |
| **5** Test Coverage | 🔴 High | Tinggi | Minggu 5-6 |
| **6** DevOps | 🟡 Medium | Rendah | Minggu 6 |
| **7** Polish | 🔵 Low | Bervariasi | Ongoing |

---

> **Catatan:** Estimasi timeline berdasarkan asumsi lo sendiri yang ngerjain ±20 jam/minggu.
> Phase bisa jalan paralel (misal Phase 4 Security bisa dikerjain sambil Phase 1 Foundation).
